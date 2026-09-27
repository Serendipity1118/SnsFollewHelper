/** 外部データ由来のURLは http(s) のときだけリンクにする（javascript: などを href に入れない）。 */
export function safeHttpUrl(raw: string | null | undefined): string | undefined {
  const url = (raw ?? "").trim();
  return /^https?:\/\//i.test(url) ? url : undefined;
}

/** キュー一覧へのリンク。絞り込み条件はクエリ文字列に入れる。 */
export function queueHref(params: {
  kind: string;
  status?: string;
  prefecture?: string;
  shop?: string;
  page?: number;
  size?: number;
}): string {
  const query = new URLSearchParams({ kind: params.kind });
  if (params.prefecture) query.set("pref", params.prefecture);
  if (params.shop) query.set("shop", params.shop);
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  return `/queue?${query.toString()}`;
}
