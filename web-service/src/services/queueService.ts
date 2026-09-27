import { z } from "zod";
import { toCsv } from "../csv/export";
import { parseCsv, requireColumns } from "../csv/parse";
import { createActionLogRepository } from "../db/actionLogRepository";
import type { Db } from "../db/database";
import { createSettingsRepository } from "../db/settingsRepository";
import { createShopRepository, type ShopFilter } from "../db/shopRepository";
import { createTargetRepository, type NewTarget, type Target, type TargetFilter } from "../db/targetRepository";
import { buildQueue, type StatusEntry } from "../domain/buildQueue";
import {
  QUEUE_COLUMNS,
  RESULT_COLUMNS,
  STATUS_ASSIGNED,
  STATUS_PENDING,
  WRITABLE_STATUSES,
  type TargetKind,
} from "../domain/constants";
import { localIsoDate, startOfLocalDay } from "../domain/dates";
import { xProfileUrl } from "../domain/handle";
import { queueItemFromCsv, queueItemToCsv } from "../domain/queueRows";
import { DAY_MS, evaluateQuota, type Quota } from "../domain/safetyGuard";
import { SHOP_REQUIRED_COLUMNS, shopFromCsv } from "../domain/shopRows";

export type QueueErrorCode = "not_found" | "invalid";

export class QueueError extends Error {
  constructor(
    message: string,
    readonly code: QueueErrorCode,
  ) {
    super(message);
  }
}

export const settingsSchema = z.object({
  batchSize: z.number().int().min(1).max(100),
  hourlyLimit: z.number().int().min(1).max(200),
  dailyLimit: z.number().int().min(1).max(1000),
});
export type Settings = z.infer<typeof settingsSchema>;

/** 週1のウォームアップ値（docs/Xフォロー優先キュー.md: 1日10〜15件, 1セッション15件まで）。 */
export const DEFAULT_SETTINGS: Settings = { batchSize: 15, hourlyLimit: 15, dailyLimit: 15 };

/** 結果として付けられる状態。「当日」は取り消し用。 */
export const MARKABLE_STATUSES: ReadonlySet<string> = new Set([...WRITABLE_STATUSES, STATUS_ASSIGNED]);

type Counts = Record<TargetKind, Record<string, number>>;
type PageQuery = { page: number; pageSize: number };

const QUOTA_RESET_KEY = "quotaResetAt";

export function createQueueService(db: Db, now: () => Date = () => new Date()) {
  const targets = createTargetRepository(db);
  const logs = createActionLogRepository(db);
  const settingsRepo = createSettingsRepository(db);
  const shops = createShopRepository(db);

  const settings = (): Settings => {
    const stored = settingsRepo.all();
    const merged = Object.fromEntries(
      Object.entries(DEFAULT_SETTINGS).map(([key, fallback]) => {
        const value = Number(stored[key]);
        return [key, Number.isInteger(value) ? value : fallback];
      }),
    );
    const parsed = settingsSchema.safeParse(merged);
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
  };

  const quotaResetAt = (): number => {
    const value = Number(settingsRepo.all()[QUOTA_RESET_KEY]);
    return Number.isFinite(value) ? value : 0;
  };

  const quota = (): Quota => {
    const at = now().getTime();
    const { hourlyLimit, dailyLimit } = settings();
    // 制限リセット以前の済は数えない（結果の記録そのものは残す）
    const since = Math.max(at - DAY_MS, quotaResetAt());
    return evaluateQuota(logs.followedSince(since), { hourlyLimit, dailyLimit }, at);
  };

  const statusMap = (kind: TargetKind) =>
    new Map<string, StatusEntry & { assignedAt: number | null }>(
      targets.byKind(kind).map((t) => [t.handle, { status: t.status, doneDate: t.doneDate, assignedAt: t.assignedAt }]),
    );

  // 結果入力・プロフィールを開く操作は個人キューだけが対象（店舗垢候補は apply_results.py と同じく触らない）
  const findPersonal = (handle: string) => {
    const target = targets.findByHandle(handle);
    return target?.kind === "personal" ? target : undefined;
  };

  const today = () => {
    const at = now();
    const dayStart = startOfLocalDay(at);
    targets.releaseAssigned(at.getTime(), dayStart);
    return { date: localIsoDate(at), items: targets.assignedSince(dayStart), quota: quota(), settings: settings() };
  };

  return {
    settings,
    quota,
    today,

    updateSettings(patch: Partial<Settings>): Settings {
      const parsed = settingsSchema.safeParse({ ...settings(), ...patch });
      if (!parsed.success) {
        throw new QueueError(`設定値が不正です: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`, "invalid");
      }
      settingsRepo.setMany(Object.entries(parsed.data).map(([k, v]) => [k, String(v)] as const));
      return parsed.data;
    },

    /** 元データ（pokepara_all_casts.csv）からキューを作り直す。進捗は handle ごとに引き継ぐ。 */
    importCasts(text: string) {
      const rows = parseCsv(text);
      requireColumns(rows, text, ["X(Twitter)"]);
      const personalMap = statusMap("personal");
      const shopMap = statusMap("shop");
      const result = buildQueue(rows, personalMap, shopMap);
      const withAssignment = (map: typeof personalMap) => (item: NewTarget): NewTarget => ({
        ...item,
        assignedAt: item.status === STATUS_ASSIGNED ? (map.get(item.handle)?.assignedAt ?? null) : null,
      });
      targets.replaceKinds(
        ["personal", "shop"],
        [...result.personal.map(withAssignment(personalMap)), ...result.shop.map(withAssignment(shopMap))],
        now().getTime(),
      );
      return {
        skipped: result.skipped,
        uniqueHandles: result.uniqueHandles,
        personal: result.personal.length,
        shop: result.shop.length,
        pending: result.personal.filter((r) => r.status === STATUS_PENDING).length,
      };
    },

    /** 既存の x_follow_queue.csv / x_follow_shop_candidates.csv を取り込む。放置された「当日」は「未」へ戻す。 */
    importQueue(text: string, kind: TargetKind) {
      const rows = parseCsv(text);
      requireColumns(rows, text, ["handle", "状態"]);
      let released = 0;
      const items = rows.flatMap((row, i) => {
        const item = queueItemFromCsv(row, i, kind);
        if (!item) return [];
        if (item.status !== STATUS_ASSIGNED) return [item];
        released += 1;
        return [{ ...item, status: STATUS_PENDING }];
      });
      targets.replaceKinds([kind], items, now().getTime());
      return { imported: items.length, released };
    },

    /** 旧 today.html が保存した follow_results_*.csv を反映する（apply_results.py 相当）。 */
    importResults(text: string) {
      const rows = parseCsv(text);
      requireColumns(rows, text, ["handle", "状態"]);
      const at = now();
      const defaultDay = localIsoDate(at);
      const unknown: string[] = [];
      let updated = 0;
      let ignored = 0;
      for (const row of rows) {
        const handle = (row.handle ?? "").trim().toLowerCase();
        const status = (row["状態"] ?? "").trim();
        if (!handle) continue;
        if (!WRITABLE_STATUSES.has(status)) {
          ignored += 1;
          continue;
        }
        const doneOn = (row["実施日"] ?? "").trim() || defaultDay;
        if (targets.applyResult(handle, status, doneOn, at.getTime())) updated += 1;
        else unknown.push(handle);
      }
      return { updated, unknown, ignored };
    },

    /** 前日以前の「当日」を戻してから、次の batchSize 件を「当日」にする。 */
    assignNext() {
      today();
      targets.assignNext(settings().batchSize, now().getTime());
      return today();
    },

    /** フォロー上限の集計を今からやり直す。済の結果や履歴は消さない。 */
    resetQuota(): Quota {
      settingsRepo.setMany([[QUOTA_RESET_KEY, String(now().getTime())]]);
      return quota();
    },

    releaseAll(): number {
      return targets.releaseAssigned(now().getTime());
    },

    /** 結果を即時保存する。status="当日" は取り消し。 */
    mark(handle: string, status: string): { item: Target; quota: Quota } {
      if (!MARKABLE_STATUSES.has(status)) throw new QueueError(`状態 ${status} は指定できません`, "invalid");
      const current = findPersonal(handle);
      if (!current) throw new QueueError(`handle ${handle} は個人キューにありません`, "not_found");
      if (current.status !== status) {
        const at = now();
        const isUndo = status === STATUS_ASSIGNED;
        // 取り消しは今日の名簿に戻す（前日の割当時刻のままだと即座に「未」へ解放されてしまう）
        targets.updateStatus(
          handle,
          status,
          isUndo ? "" : localIsoDate(at),
          isUndo ? at.getTime() : current.assignedAt,
          at.getTime(),
        );
        logs.record(handle, current.status, status, at.getTime());
      }
      return { item: targets.findByHandle(handle)!, quota: quota() };
    },

    /** プロフィールを開いてよいか。上限到達時は開かせない（結果入力は止めない）。 */
    canOpen(handle: string):
      | { ok: true; url: string; quota: Quota }
      | { ok: false; reason: "unknown" | "quota"; quota: Quota } {
      const q = quota();
      if (!findPersonal(handle)) return { ok: false, reason: "unknown", quota: q };
      if (q.blocked) return { ok: false, reason: "quota", quota: q };
      return { ok: true, url: xProfileUrl(handle), quota: q };
    },

    counts(): Counts {
      const counts: Counts = { personal: {}, shop: {} };
      for (const row of targets.counts()) {
        counts[row.kind] = { ...counts[row.kind], [row.status]: row.count };
      }
      return counts;
    },

    list(query: TargetFilter & PageQuery) {
      const { page: rawPage, pageSize, ...filter } = query;
      const page = Math.max(1, Math.floor(rawPage));
      const { total, items } = targets.page(filter, (page - 1) * pageSize, pageSize);
      return { total, items, page, pageSize };
    },

    /** pokepara_all_shops.csv を取り込み、店舗一覧を入れ替える。店舗URLが空の行と重複は除く。 */
    importShops(text: string) {
      const rows = parseCsv(text);
      requireColumns(rows, text, SHOP_REQUIRED_COLUMNS);
      const seen = new Set<string>();
      let skipped = 0;
      let duplicates = 0;
      const items = rows.flatMap((row) => {
        const shop = shopFromCsv(row);
        if (!shop) {
          skipped += 1;
          return [];
        }
        if (seen.has(shop.shopUrl)) {
          duplicates += 1;
          return [];
        }
        seen.add(shop.shopUrl);
        return [shop];
      });
      shops.replaceAll(items, now().getTime());
      return { imported: items.length, skipped, duplicates };
    },

    listShops(query: ShopFilter & PageQuery) {
      const { page: rawPage, pageSize, ...filter } = query;
      const page = Math.max(1, Math.floor(rawPage));
      const { total, items } = shops.page(filter, (page - 1) * pageSize, pageSize);
      return { total, items, page, pageSize };
    },

    shopPrefectures() {
      return shops.prefectures();
    },

    exportQueue(kind: TargetKind): string {
      return toCsv(QUEUE_COLUMNS, targets.byKind(kind).map(queueItemToCsv));
    },

    exportResults(doneDate?: string): string {
      return toCsv(
        RESULT_COLUMNS,
        targets.finished(doneDate).map((t) => ({ handle: t.handle, 状態: t.status, 実施日: t.doneDate })),
      );
    },
  };
}

export type QueueService = ReturnType<typeof createQueueService>;
