// X のプロフィール画面を読み取って状態を判定する。X の画面構造に依存する処理はこのファイルに集める。
// 読み取るだけで、ボタンを押したりイベントを送ったりはしない。
(() => {
  "use strict";

  const FOLLOW_BUTTON = /-(follow|unfollow|cancel)$/;
  const STATE_BY_SUFFIX = { follow: "unfollowed", unfollow: "followed", cancel: "pending" };
  const NOT_FOUND_TEXT = /存在しません|doesn[’']t exist/i;
  const SUSPENDED_TEXT = /凍結|suspended/i;

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  /** ボタンの aria-label に「@handle」がそのまま含まれるか（@alice と @alice_2 を区別する）。 */
  function labelledFor(button, handle) {
    const label = button.getAttribute("aria-label") || "";
    return new RegExp(`@${escapeRegExp(handle)}(?![A-Za-z0-9_])`, "i").test(label);
  }

  /**
   * プロフィール本人のフォローボタン（フォロー／フォロー中／承認待ち）。
   * おすすめユーザー欄のボタンと取り違えないよう、handle 入りのラベル → ヘッダー → 先頭 の順で選ぶ。
   * @param {Document} doc
   * @param {string} handle
   * @returns {Element | null}
   */
  function profileFollowButton(doc, handle) {
    const column = doc.querySelector('[data-testid="primaryColumn"]');
    if (!column) return null;
    const buttons = [...column.querySelectorAll("[data-testid]")].filter((node) =>
      FOLLOW_BUTTON.test(node.getAttribute("data-testid")),
    );
    return (
      buttons.find((node) => labelledFor(node, handle)) ??
      buttons.find((node) => node.closest('[data-testid="placementTracking"]')) ??
      buttons[0] ??
      null
    );
  }

  /**
   * @param {Document} doc
   * @param {string} handle
   * @returns {"not_found" | "suspended" | "followed" | "pending" | "unfollowed" | "unknown"}
   */
  function detectProfile(doc, handle) {
    // ユーザー名として正しくないURLでは primaryColumn が無く、error-detail に「このページは存在しません」だけが出る
    const errorText = doc.querySelector('[data-testid="error-detail"]')?.textContent || "";
    if (NOT_FOUND_TEXT.test(errorText)) return "not_found";
    const column = doc.querySelector('[data-testid="primaryColumn"]');
    if (!column) return "unknown";
    // emptyState は「存在しない」「凍結」のほか、鍵垢のポスト欄（ポストは非公開です）やエラーにも出る。
    // 前の2つ以外はフォローボタンで判定する（ボタンが無ければ unknown）。
    const emptyText = column.querySelector('[data-testid="emptyState"]')?.textContent || "";
    if (NOT_FOUND_TEXT.test(emptyText)) return "not_found";
    if (SUSPENDED_TEXT.test(emptyText)) return "suspended";
    const button = profileFollowButton(doc, handle);
    if (!button) return "unknown";
    const suffix = FOLLOW_BUTTON.exec(button.getAttribute("data-testid"))[1];
    return STATE_BY_SUFFIX[suffix];
  }

  globalThis.FollowHelper = { ...globalThis.FollowHelper, detectProfile, profileFollowButton };
})();
