import type { CsvRow, QueueItem } from "./buildQueue";
import { STATUS_PENDING, STATUS_SHOP, type TargetKind } from "./constants";

const positiveInt = (raw: string | undefined, fallback: number) => {
  const value = Number.parseInt((raw ?? "").trim(), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

/** キューCSV（QUEUE_COLUMNS）の1行を QueueItem にする。handle が空なら null。 */
export function queueItemFromCsv(row: CsvRow, index: number, kind: TargetKind): QueueItem | null {
  const handle = (row.handle ?? "").trim().toLowerCase();
  if (!handle) return null;
  const text = (key: string) => (row[key] ?? "").trim();
  return {
    kind,
    priority: positiveInt(row["優先度"], index + 1),
    prefecture: text("都道府県"),
    shop: text("店舗"),
    castName: text("キャスト名"),
    handle,
    profileUrl: text("プロフィールURL"),
    occurrences: positiveInt(row["出現回数"], 1),
    lastUpdated: text("最終更新日"),
    status: text("状態") || (kind === "shop" ? STATUS_SHOP : STATUS_PENDING),
    doneDate: text("実施日"),
  };
}

export function queueItemToCsv(item: QueueItem): Record<string, string> {
  return {
    優先度: String(item.priority),
    都道府県: item.prefecture,
    店舗: item.shop,
    キャスト名: item.castName,
    handle: item.handle,
    プロフィールURL: item.profileUrl,
    出現回数: String(item.occurrences),
    最終更新日: item.lastUpdated,
    状態: item.status,
    実施日: item.doneDate,
  };
}
