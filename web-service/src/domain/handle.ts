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

const INSTAGRAM_HANDLE_RE = /instagram\.com\/@?([^/?#]+)/i;
/** Instagramのユーザー名: 英数字と _ . の30文字まで。 */
const INSTAGRAM_USERNAME = /^[a-z0-9._]{1,30}$/;
/** instagram.com 直下にあってプロフィールではないパス。 */
export const INSTAGRAM_RESERVED: ReadonlySet<string> = new Set([
  "about",
  "accounts",
  "challenge",
  "developer",
  "direct",
  "explore",
  "invites",
  "legal",
  "p",
  "reel",
  "reels",
  "stories",
  "tv",
  "web",
  "_u",
]);

/**
 * キャストCSVの Instagram 列（https://www.instagram.com/<name>/ など）から小文字のhandleを取り出す。
 * 空白・全角文字の扱いは normalizeHandle と同じ。Instagramのユーザー名にならない値は null。
 */
export function normalizeInstagramHandle(url: string | null | undefined): string | null {
  const text = (url ?? "").trim();
  if (!text) return null;
  const match = INSTAGRAM_HANDLE_RE.exec(text);
  if (!match?.[1]) return null;
  const handle = decodeOrKeep(match[1]).normalize("NFKC").replace(SPACES, "").replace(/^@+/, "").toLowerCase();
  if (!INSTAGRAM_USERNAME.test(handle) || INSTAGRAM_RESERVED.has(handle)) return null;
  return handle;
}

/** instagram.com のプロフィールURL。handle は normalizeInstagramHandle 済みの前提。 */
export function instagramProfileUrl(handle: string): string {
  return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
}
