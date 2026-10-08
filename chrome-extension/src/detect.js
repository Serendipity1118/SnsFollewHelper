// X / Instagram のプロフィール画面を読み取って状態を判定する。画面構造に依存する処理はこのファイルに集める。
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

  // ---- Instagram ----
  // 2026-10 時点の画面: プロフィールは main > header に h2（ユーザー名）とフォローボタン（<button>のテキストのみ、data-testid なし）。
  // 存在しないユーザーは header が無く「このページはご利用いただけません。」だけが出る（凍結・削除も同じ表示）。

  const IG_NOT_FOUND_TEXT = /このページはご利用いただけません|Sorry, this page isn[’']t available/i;
  const IG_STATE_BY_TEXT = new Map([
    ["フォロー", "unfollowed"],
    ["フォローバックする", "unfollowed"],
    ["follow", "unfollowed"],
    ["follow back", "unfollowed"],
    ["フォロー中", "followed"],
    ["following", "followed"],
    ["リクエスト済み", "pending"],
    ["requested", "pending"],
  ]);

  const buttonState = (button) => IG_STATE_BY_TEXT.get(button.textContent.trim().toLowerCase());

  /**
   * 表示中のプロフィール本人のヘッダー。画面遷移の直後に前の人のヘッダーが残っていても取り違えないよう、
   * ユーザー名（h1/h2）が handle と一致するものだけを返す。
   */
  function instagramProfileHeader(doc, handle) {
    const target = handle.toLowerCase();
    return (
      [...doc.querySelectorAll("main header")].find((header) =>
        [...header.querySelectorAll("h1, h2")].some((h) => h.textContent.trim().toLowerCase() === target),
      ) ?? null
    );
  }

  /**
   * プロフィール本人のフォローボタン（フォロー／フォロー中／リクエスト済み）。
   * ヘッダー内で最初に見つかったもの（「同じようなアカウント」のおすすめはその後ろに並ぶ）。
   * @param {Document} doc
   * @param {string} handle
   * @returns {Element | null}
   */
  function instagramFollowButton(doc, handle) {
    const header = instagramProfileHeader(doc, handle);
    if (!header) return null;
    return [...header.querySelectorAll("button")].find((button) => buttonState(button)) ?? null;
  }

  /**
   * @param {Document} doc
   * @param {string} handle
   * @returns {"not_found" | "followed" | "pending" | "unfollowed" | "unknown"}
   */
  function detectInstagramProfile(doc, handle) {
    const main = doc.querySelector("main");
    if (!main) return "unknown";
    const button = instagramFollowButton(doc, handle);
    if (button) return buttonState(button);
    if (!main.querySelector("header") && IG_NOT_FOUND_TEXT.test(main.textContent || "")) return "not_found";
    return "unknown";
  }

  // ---- プラットフォームの振り分け ----

  /**
   * @param {Document} doc
   * @param {"x" | "instagram"} platform
   * @param {string} handle
   */
  function detect(doc, platform, handle) {
    return platform === "instagram" ? detectInstagramProfile(doc, handle) : detectProfile(doc, handle);
  }

  /**
   * 人がクリックした要素が、プロフィール本人の「フォロー」（未フォロー状態のボタン）か。
   * @param {Document} doc
   * @param {"x" | "instagram"} platform
   * @param {string} handle
   * @param {Element} target クリックされた要素
   */
  function isFollowClick(doc, platform, handle, target) {
    if (platform === "instagram") {
      const button = target.closest("button");
      return Boolean(button) && button === instagramFollowButton(doc, handle) && buttonState(button) === "unfollowed";
    }
    const clicked = target.closest("[data-testid]");
    if (!clicked || !/-follow$/.test(clicked.getAttribute("data-testid"))) return false;
    return clicked === profileFollowButton(doc, handle); // おすすめ欄などのフォローは対象外
  }

  globalThis.FollowHelper = {
    ...globalThis.FollowHelper,
    detect,
    detectProfile,
    detectInstagramProfile,
    isFollowClick,
    instagramFollowButton,
    profileFollowButton,
  };
})();
