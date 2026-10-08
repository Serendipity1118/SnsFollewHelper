import {
  SHOP_SHARE_THRESHOLD,
  STATUS_PENDING,
  STATUS_SHOP,
  prefRank,
  type TargetKind,
} from "./constants";
import { parseUpdateDate } from "./dates";
import { normalizeHandle } from "./handle";

export type CsvRow = Record<string, string | undefined>;

export interface StatusEntry {
  status: string;
  doneDate: string;
}

export interface QueueItem {
  kind: TargetKind;
  priority: number;
  prefecture: string;
  shop: string;
  castName: string;
  handle: string;
  profileUrl: string;
  occurrences: number;
  lastUpdated: string;
  status: string;
  doneDate: string;
}

export interface BuildResult {
  personal: QueueItem[];
  shop: QueueItem[];
  skipped: number;
  uniqueHandles: number;
}

const field = (row: CsvRow, key: string) => (row[key] ?? "").trim();

/** queue_lib.load_status_map の移植。handle -> (状態, 実施日)。 */
export function statusMapFromRows(rows: readonly CsvRow[]): Map<string, StatusEntry> {
  const map = new Map<string, StatusEntry>();
  for (const row of rows) {
    const handle = field(row, "handle").toLowerCase();
    if (!handle) continue;
    map.set(handle, {
      status: row["状態"] || STATUS_PENDING,
      doneDate: row["実施日"] || "",
    });
  }
  return map;
}

// Pythonの str 比較（コードポイント順）に合わせる。localeCompare は使わない。
function compareText(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

const dateStamp = (raw: string | undefined) => parseUpdateDate(raw) ?? -1;

/** build_queue.pick_representative: 新しい更新日を先に、日付なしは最後、同日はキャスト名順。 */
function pickRepresentative(rows: readonly CsvRow[]): CsvRow {
  const sorted = [...rows].sort(
    (a, b) =>
      dateStamp(b["最終更新日"]) - dateStamp(a["最終更新日"]) ||
      compareText(a["キャスト名"] ?? "", b["キャスト名"] ?? ""),
  );
  return sorted[0]!;
}

function displayName(rep: CsvRow, shareCount: number): string {
  const name = field(rep, "キャスト名") || "(無名)";
  const others = shareCount - 1;
  return others <= 0 ? name : `${name}（ほか${others}名）`;
}

function compareQueue(a: QueueItem, b: QueueItem): number {
  return (
    prefRank(a.prefecture) - prefRank(b.prefecture) ||
    a.occurrences - b.occurrences ||
    dateStamp(b.lastUpdated) - dateStamp(a.lastUpdated) ||
    compareText(a.handle, b.handle)
  );
}

function renumber(items: QueueItem[]): QueueItem[] {
  return [...items].sort(compareQueue).map((item, i) => ({ ...item, priority: i + 1 }));
}

/** handle を読む列と、その値から handle を取り出す関数。既定は X(Twitter) 列。 */
export interface HandleSource {
  column: string;
  normalize: (raw: string | null | undefined) => string | null;
}

const X_SOURCE: HandleSource = { column: "X(Twitter)", normalize: normalizeHandle };

/** build_queue.build の移植。キャストCSVの行から個人キューと店舗垢候補を作る。 */
export function buildQueue(
  castRows: readonly CsvRow[],
  existingPersonal: ReadonlyMap<string, StatusEntry>,
  existingShop: ReadonlyMap<string, StatusEntry>,
  source: HandleSource = X_SOURCE,
): BuildResult {
  const grouped = new Map<string, CsvRow[]>();
  let skipped = 0;
  for (const row of castRows) {
    const handle = source.normalize(row[source.column]);
    if (!handle) {
      skipped += 1;
      continue;
    }
    const group = grouped.get(handle);
    if (group) group.push(row);
    else grouped.set(handle, [row]);
  }

  const items = [...grouped.entries()].map(([handle, rows]): QueueItem => {
    const shareCount = rows.length;
    const rep = pickRepresentative(rows);
    const isShop = shareCount >= SHOP_SHARE_THRESHOLD;
    const existing = (isShop ? existingShop : existingPersonal).get(handle);
    const fallback = isShop ? STATUS_SHOP : STATUS_PENDING;
    return {
      kind: isShop ? "shop" : "personal",
      priority: 0,
      prefecture: field(rep, "都道府県"),
      shop: field(rep, "店舗名"),
      castName: displayName(rep, shareCount),
      handle,
      profileUrl: field(rep, "プロフィールURL"),
      occurrences: shareCount,
      lastUpdated: field(rep, "最終更新日"),
      status: existing?.status || fallback,
      doneDate: existing?.doneDate ?? "",
    };
  });

  return {
    personal: renumber(items.filter((i) => i.kind === "personal")),
    shop: renumber(items.filter((i) => i.kind === "shop")),
    skipped,
    uniqueHandles: grouped.size,
  };
}
