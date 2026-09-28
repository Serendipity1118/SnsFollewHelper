// X のプロフィールURLから handle を取り出す。content script（クラシック）とテスト（ESM）の両方で読めるよう、グローバルに公開する。
(() => {
  "use strict";

  // manifest.json の content_scripts.matches と揃える
  const X_HOSTS = new Set(["x.com", "twitter.com"]);
  // web-service/src/domain/constants.ts の SKIP_HANDLES と同じ考え方。X自身のページはプロフィールではない。
  const RESERVED = new Set([
    "compose", "explore", "hashtag", "home", "i", "intent", "jobs", "login", "logout", "messages",
    "notifications", "privacy", "search", "settings", "share", "signup", "tos", "account",
  ]);
  // Xのユーザー名として正しくない値（名簿に紛れた空白・全角＠入りなど）も、X が「このページは存在しません」を出すので対象にする
  const SINGLE_SEGMENT = /^\/([^/]+)\/?$/;

  /**
   * @param {string} url
   * @returns {string | null} 小文字の handle（名簿の値そのもの。/go/<handle> で開いた URL をデコードしたもの）。
   *   プロフィールのトップでなければ null。
   */
  function profileHandle(url) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }
    if (!X_HOSTS.has(parsed.hostname)) return null;
    const match = SINGLE_SEGMENT.exec(parsed.pathname);
    if (!match) return null;
    let handle;
    try {
      handle = decodeURIComponent(match[1]).toLowerCase();
    } catch {
      return null;
    }
    // "." を含むものはファイル（robots.txt など）。Webサービスも handle として扱わない
    if (handle.includes(".") || RESERVED.has(handle)) return null;
    return handle;
  }

  globalThis.FollowHelper = { ...globalThis.FollowHelper, profileHandle };
})();
