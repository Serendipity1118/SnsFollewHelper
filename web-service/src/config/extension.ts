/**
 * フォロー補助Chrome拡張（chrome-extension/）のID。
 * manifest.json の "key" から決まる固定値。別IDで読み込む場合は環境変数 EXTENSION_ID で上書きする。
 */
export const DEFAULT_EXTENSION_ID = "liiicjpegnmagfdlnmbnebdfkdkjjlpl";

const EXTENSION_ID_PATTERN = /^[a-p]{32}$/;

export function extensionOrigin(raw: string | undefined): string {
  const id = raw === undefined || raw === "" ? DEFAULT_EXTENSION_ID : raw.trim().toLowerCase();
  if (!EXTENSION_ID_PATTERN.test(id)) throw new Error(`EXTENSION_ID が不正です: ${raw}`);
  return `chrome-extension://${id}`;
}
