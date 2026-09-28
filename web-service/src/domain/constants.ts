// tools/x-follow-queue/queue_lib.py の定義をそのまま移植する。自動フォローはしない。

export const QUEUE_COLUMNS = [
  "優先度",
  "都道府県",
  "店舗",
  "キャスト名",
  "handle",
  "プロフィールURL",
  "出現回数",
  "最終更新日",
  "状態",
  "実施日",
] as const;

export const RESULT_COLUMNS = ["handle", "状態", "実施日"] as const;

export const STATUS_PENDING = "未";
export const STATUS_ASSIGNED = "当日";
export const STATUS_DONE = "済";
export const STATUS_SKIP = "スキップ";
export const STATUS_DEAD = "死垢";
export const STATUS_SHOP = "店舗垢候補";

export const WRITABLE_STATUSES: ReadonlySet<string> = new Set([
  STATUS_DONE,
  STATUS_SKIP,
  STATUS_DEAD,
]);

export type TargetKind = "personal" | "shop";

// 東京 → 大阪 → 北海道・愛知・神奈川、その後は件数の多い県順
export const PREF_RANK: Readonly<Record<string, number>> = {
  tokyo: 0,
  osaka: 1,
  _hokkaido: 2,
  aichi: 3,
  kanagawa: 4,
  miyagi: 5,
  saitama: 6,
  hiroshima: 7,
  fukuoka: 8,
  hyogo: 9,
  chiba: 10,
  _shizuoka: 11,
};
export const PREF_RANK_DEFAULT = 100;

export const SKIP_HANDLES: ReadonlySet<string> = new Set([
  "intent",
  "share",
  "search",
  "home",
  "i",
  "hashtag",
  "explore",
  "login",
  "signup",
  "privacy",
  "tos",
  "settings",
  "messages",
  "notifications",
  "compose",
]);

export const SHOP_SHARE_THRESHOLD = 5;

/** Xの総フォロー上限の目安（フォロワー約4,500未満では超えられない）。 */
export const FOLLOW_CAP = 5000;

export function prefRank(pref: string): number {
  return PREF_RANK[pref] ?? PREF_RANK_DEFAULT;
}
