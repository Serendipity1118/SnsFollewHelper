import type { QueueItem } from "../domain/buildQueue";
import { STATUS_ASSIGNED, STATUS_DONE, STATUS_PENDING, WRITABLE_STATUSES, type TargetKind } from "../domain/constants";
import type { Platform } from "../domain/platform";
import type { Db } from "./database";

export interface Target extends QueueItem {
  assignedAt: number | null;
  updatedAt: number;
}

export type NewTarget = QueueItem & { assignedAt?: number | null };

export interface TargetFilter {
  kind: TargetKind;
  status?: string;
  prefecture?: string;
  shop?: string;
  /** handle・キャスト名・店舗名の部分一致 */
  q?: string;
}

const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

const SELECT = `SELECT handle, kind, priority, prefecture, shop, cast_name AS castName,
  profile_url AS profileUrl, occurrences, last_updated AS lastUpdated, status,
  done_date AS doneDate, assigned_at AS assignedAt, updated_at AS updatedAt FROM targets`;

const WRITABLE = [...WRITABLE_STATUSES];
const WRITABLE_PLACEHOLDERS = WRITABLE.map(() => "?").join(", ");

/** 1つのプラットフォーム（X / Instagram）の名簿だけを読み書きする。 */
export function createTargetRepository(db: Db, platform: Platform = "x") {
  const upsert = db.prepare(`INSERT INTO targets
    (platform, handle, kind, priority, prefecture, shop, cast_name, profile_url, occurrences, last_updated,
     status, done_date, assigned_at, updated_at)
    VALUES (@platform, @handle, @kind, @priority, @prefecture, @shop, @castName, @profileUrl, @occurrences,
     @lastUpdated, @status, @doneDate, @assignedAt, @updatedAt)
    ON CONFLICT(platform, handle) DO UPDATE SET kind = excluded.kind, priority = excluded.priority,
     prefecture = excluded.prefecture, shop = excluded.shop, cast_name = excluded.cast_name,
     profile_url = excluded.profile_url, occurrences = excluded.occurrences,
     last_updated = excluded.last_updated, status = excluded.status, done_date = excluded.done_date,
     assigned_at = excluded.assigned_at, updated_at = excluded.updated_at`);

  const insertAll = (items: readonly NewTarget[], now: number) => {
    for (const item of items) {
      upsert.run({ ...item, platform, assignedAt: item.assignedAt ?? null, updatedAt: now });
    }
  };

  return {
    findByHandle(handle: string): Target | undefined {
      return db.prepare(`${SELECT} WHERE platform = ? AND handle = ?`).get(platform, handle) as Target | undefined;
    },

    byKind(kind: TargetKind): Target[] {
      return db.prepare(`${SELECT} WHERE platform = ? AND kind = ? ORDER BY priority, handle`).all(platform, kind) as Target[];
    },

    /** 指定した種類の行をすべて入れ替える。 */
    replaceKinds: db.transaction((kinds: readonly TargetKind[], items: readonly NewTarget[], now: number) => {
      const remove = db.prepare("DELETE FROM targets WHERE platform = ? AND kind = ?");
      for (const kind of kinds) remove.run(platform, kind);
      insertAll(items, now);
    }),

    /** 結果（済/既フォロー/スキップ/死垢）を書き込む。個人キューのみが対象。 */
    applyResult(handle: string, status: string, doneDate: string, now: number): boolean {
      const info = db
        .prepare(
          "UPDATE targets SET status = ?, done_date = ?, updated_at = ? WHERE platform = ? AND handle = ? AND kind = 'personal'",
        )
        .run(status, doneDate, now, platform, handle);
      return info.changes > 0;
    },

    updateStatus(handle: string, status: string, doneDate: string, assignedAt: number | null, now: number): void {
      db.prepare(
        "UPDATE targets SET status = ?, done_date = ?, assigned_at = ?, updated_at = ? WHERE platform = ? AND handle = ?",
      ).run(status, doneDate, assignedAt, now, platform, handle);
    },

    /** 「当日」を「未」へ戻す。before を渡すと、それより前に割り当てた行だけを戻す。 */
    releaseAssigned(now: number, before?: number): number {
      const cond = before === undefined ? "" : " AND (assigned_at IS NULL OR assigned_at < @before)";
      const info = db
        .prepare(
          `UPDATE targets SET status = @pending, assigned_at = NULL, updated_at = @now
           WHERE platform = @platform AND kind = 'personal' AND status = @assigned${cond}`,
        )
        .run({ platform, pending: STATUS_PENDING, assigned: STATUS_ASSIGNED, now, before });
      return info.changes;
    },

    assignNext: db.transaction((limit: number, now: number): number => {
      const handles = db
        .prepare(
          "SELECT handle FROM targets WHERE platform = ? AND kind = 'personal' AND status = ? ORDER BY priority, handle LIMIT ?",
        )
        .pluck()
        .all(platform, STATUS_PENDING, limit) as string[];
      const assign = db.prepare(
        "UPDATE targets SET status = ?, done_date = '', assigned_at = ?, updated_at = ? WHERE platform = ? AND handle = ?",
      );
      for (const handle of handles) assign.run(STATUS_ASSIGNED, now, now, platform, handle);
      return handles.length;
    }),

    assignedSince(since: number): Target[] {
      return db
        .prepare(`${SELECT} WHERE platform = ? AND kind = 'personal' AND assigned_at >= ? ORDER BY priority, handle`)
        .all(platform, since) as Target[];
    },

    counts(): Array<{ kind: TargetKind; status: string; count: number }> {
      return db
        .prepare("SELECT kind, status, COUNT(*) AS count FROM targets WHERE platform = ? GROUP BY kind, status")
        .all(platform) as Array<{ kind: TargetKind; status: string; count: number }>;
    },

    page(filter: TargetFilter, offset: number, limit: number) {
      const conds = ["platform = @platform", "kind = @kind"];
      if (filter.status) conds.push("status = @status");
      if (filter.prefecture) conds.push("prefecture = @prefecture");
      if (filter.shop) conds.push("shop = @shop");
      const q = filter.q?.trim();
      if (q) {
        conds.push(`(${["handle", "cast_name", "shop"].map((col) => `${col} LIKE @like ESCAPE '\\'`).join(" OR ")})`);
      }
      const where = `WHERE ${conds.join(" AND ")}`;
      const { q: _q, ...rest } = filter;
      const params = { ...rest, platform, ...(q ? { like: `%${escapeLike(q)}%` } : {}), offset, limit };
      const total = db.prepare(`SELECT COUNT(*) FROM targets ${where}`).pluck().get(params) as number;
      const items = db
        .prepare(`${SELECT} ${where} ORDER BY priority, handle LIMIT @limit OFFSET @offset`)
        .all(params) as Target[];
      return { total, items };
    },

    /** 種類ごとの都道府県と件数（多い順）。status を渡すとその状態だけを数える。 */
    prefectureCounts(kind: TargetKind, status?: string): Array<{ prefecture: string; count: number }> {
      const cond = status ? " AND status = @status" : "";
      return db
        .prepare(
          `SELECT prefecture, COUNT(*) AS count FROM targets WHERE platform = @platform AND kind = @kind${cond}
           GROUP BY prefecture ORDER BY count DESC, prefecture`,
        )
        .all({ platform, kind, status }) as Array<{ prefecture: string; count: number }>;
    },

    /** 最初に「済」にした実施日（YYYY-MM-DD）。まだなければ undefined。 */
    firstDoneDate(): string | undefined {
      const value = db
        .prepare(
          "SELECT MIN(done_date) FROM targets WHERE platform = ? AND kind = 'personal' AND status = ? AND done_date <> ''",
        )
        .pluck()
        .get(platform, STATUS_DONE) as string | null;
      return value ?? undefined;
    },

    /** 済/既フォロー/スキップ/死垢 の個人キュー。実施日の新しい順。 */
    finished(doneDate?: string): Target[] {
      const dateCond = doneDate ? " AND done_date = ?" : "";
      const params = doneDate ? [platform, ...WRITABLE, doneDate] : [platform, ...WRITABLE];
      return db
        .prepare(
          `${SELECT} WHERE platform = ? AND kind = 'personal' AND status IN (${WRITABLE_PLACEHOLDERS})${dateCond}
           ORDER BY done_date DESC, priority, handle`,
        )
        .all(...params) as Target[];
    },
  };
}

export type TargetRepository = ReturnType<typeof createTargetRepository>;
