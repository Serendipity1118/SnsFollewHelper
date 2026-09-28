/** 外部データ由来のURLは http(s) のときだけリンクにする（javascript: などを href に入れない）。 */
export function safeHttpUrl(raw: string | null | undefined): string | undefined {
  const url = (raw ?? "").trim();
  return /^https?:\/\//i.test(url) ? url : undefined;
}

export type ListTab = "personal" | "shop" | "shops";

export interface ListQuery {
  tab: ListTab;
  status?: string;
  prefecture?: string;
  shop?: string;
  q?: string;
  page?: number;
  size?: number;
}

/** 名簿画面へのリンク。絞り込み条件はクエリ文字列に入れる。 */
export function listHref(params: ListQuery): string {
  const query = new URLSearchParams({ tab: params.tab });
  if (params.prefecture) query.set("pref", params.prefecture);
  if (params.shop) query.set("shop", params.shop);
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  return `/list?${query.toString()}`;
}
