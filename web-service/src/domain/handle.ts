import { SKIP_HANDLES } from "./constants";

const HANDLE_RE = /(?:twitter|x)\.com\/(?:#!\/)?@?([^/?#]+)/i;
/** Xのユーザー名: 英数字と _ の15文字まで。 */
const X_USERNAME = /^[a-z0-9_]{1,15}$/;
const SPACES = /[\s\u200b-\u200d\ufeff]/g; // 空白とゼロ幅文字

function decodeOrKeep(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * queue_lib.normalize_handle の移植。XのURLから小文字のhandleを取り出す。
 * 元データに紛れた空白・全角＠／＿（URLエンコード済みを含む）は取り除いて半角にする。
 * それでもXのユーザー名にならない値は null（取り込まない）。
 */
export function normalizeHandle(url: string | null | undefined): string | null {
  const text = (url ?? "").trim();
  if (!text) return null;
  const match = HANDLE_RE.exec(text);
  if (!match?.[1]) return null;
  const handle = decodeOrKeep(match[1]).normalize("NFKC").replace(SPACES, "").replace(/^@+/, "").toLowerCase();
  if (!X_USERNAME.test(handle) || SKIP_HANDLES.has(handle)) return null;
  return handle;
}

/** x.com のプロフィールURL。handle は normalizeHandle 済みの前提。 */
export function xProfileUrl(handle: string): string {
  return `https://x.com/${encodeURIComponent(handle)}`;
}
