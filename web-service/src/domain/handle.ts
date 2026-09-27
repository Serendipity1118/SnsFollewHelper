import { SKIP_HANDLES } from "./constants";

const HANDLE_RE = /(?:twitter|x)\.com\/(?:#!\/)?@?([^/?#]+)/i;

/** queue_lib.normalize_handle の移植。XのURLから小文字のhandleを取り出す。 */
export function normalizeHandle(url: string | null | undefined): string | null {
  const text = (url ?? "").trim();
  if (!text) return null;
  const match = HANDLE_RE.exec(text);
  if (!match?.[1]) return null;
  const handle = match[1].toLowerCase().trim();
  if (!handle || SKIP_HANDLES.has(handle)) return null;
  if (handle.includes(".")) return null;
  return handle;
}

/** x.com のプロフィールURL。handle は normalizeHandle 済みの前提。 */
export function xProfileUrl(handle: string): string {
  return `https://x.com/${encodeURIComponent(handle)}`;
}
