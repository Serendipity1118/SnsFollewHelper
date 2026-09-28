import { STATUS_ALREADY, STATUS_ASSIGNED, STATUS_DEAD, STATUS_DONE, STATUS_PENDING, STATUS_SHOP, STATUS_SKIP } from "./constants";

// 保存する値は旧ツール互換のまま。画面では行動で表す。
const LABELS: Readonly<Record<string, string>> = {
  [STATUS_PENDING]: "未着手",
  [STATUS_ASSIGNED]: "今日の名簿",
  [STATUS_DONE]: "フォローした",
  [STATUS_SKIP]: "見送り",
  [STATUS_DEAD]: "死垢",
  [STATUS_SHOP]: "店舗垢候補",
  [STATUS_ALREADY]: "フォロー済みだった",
};

export function statusLabel(status: string): string {
  return LABELS[status] ?? status;
}
