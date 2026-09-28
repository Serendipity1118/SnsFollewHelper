// X のページで動く。プロフィールを読み取って判定し、結果を service worker へ渡す（タブを閉じるのは service worker）。
// 重要: フォローボタンを押す・クリックイベントを送る処理は書かない。人のクリックを「聞く」だけ。
(() => {
  "use strict";

  const H = globalThis.FollowHelper;
  const DETECT_TIMEOUT_MS = 10_000;
  const URL_CHECK_MS = 1000;
  const DEBOUNCE_MS = 150;
  const TOAST_MS = 8000;
  const DECISIVE = new Set(["not_found", "suspended", "followed", "pending"]);
  const FOLLOWING = new Set(["followed", "pending"]);
  const FOLLOW_BUTTON_TESTID = /-follow$/;
  // このタブで人がフォローを押した印。記録に失敗して再読み込みしたときに「既フォロー」ではなく「済」で送り直すため。
  const clickedKey = (handle) => `followHelper:clicked:${handle}`;

  let settings = H.normalizeSettings({});
  let session = null;

  // ---- 表示 ----

  function toast(text) {
    const box = document.createElement("div");
    box.textContent = `フォロー補助: ${text}`;
    box.setAttribute("role", "status");
    Object.assign(box.style, {
      position: "fixed", right: "16px", bottom: "16px", zIndex: "2147483647", maxWidth: "360px",
      padding: "10px 14px", borderRadius: "8px", background: "#b42318", color: "#fff",
      font: "14px/1.5 system-ui, sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,.3)",
    });
    document.body.appendChild(box);
    setTimeout(() => box.remove(), TOAST_MS);
  }

  // ---- 1プロフィール分の監視 ----

  function endSession() {
    if (!session) return;
    session.observer.disconnect();
    clearTimeout(session.detectTimer);
    clearTimeout(session.closeTimer);
    clearTimeout(session.debounce);
    session = null;
  }

  async function report(kind) {
    const current = session;
    if (!current || current.reported) return;
    current.reported = true;
    current.observer.disconnect();
    let result;
    try {
      result = await chrome.runtime.sendMessage({ type: "report", handle: current.handle, kind });
    } catch {
      result = { close: false, error: "拡張機能を再読み込みしてください。" };
    }
    // 閉じられなかった場合だけここに戻る
    if (result && !result.close && result.error) toast(result.error);
  }

  function wasClicked(handle) {
    try {
      return sessionStorage.getItem(clickedKey(handle)) === "1";
    } catch {
      return false;
    }
  }

  function rememberClick(handle) {
    try {
      sessionStorage.setItem(clickedKey(handle), "1");
    } catch {
      // 保存できなくても今回の判定には影響しない
    }
  }

  /** フォロー中の表示が続いていれば閉じる（待ち時間中にフォロー解除されたら何もしない）。 */
  function scheduleClose() {
    const current = session;
    clearTimeout(current.closeTimer);
    current.closeTimer = setTimeout(() => {
      if (session !== current || !settings.enabled) return;
      if (FOLLOWING.has(H.detectProfile(document, current.handle))) report("followed_now");
    }, settings.closeDelayMs);
  }

  function check() {
    const current = session;
    if (!current || current.reported || !settings.enabled) return;
    const state = H.detectProfile(document, current.handle);
    if (current.awaitingFollow) {
      if (FOLLOWING.has(state)) {
        current.awaitingFollow = false;
        scheduleClose();
      }
      return;
    }
    if (current.decided) return;
    if (!DECISIVE.has(state) && state !== "unfollowed") return;
    current.decided = true;
    clearTimeout(current.detectTimer);
    if (state === "unfollowed") return; // 未フォローのタブは残す
    report(FOLLOWING.has(state) && wasClicked(current.handle) ? "followed_now" : state);
  }

  function scheduleCheck() {
    if (!session) return;
    clearTimeout(session.debounce);
    session.debounce = setTimeout(check, DEBOUNCE_MS);
  }

  function startSession(handle) {
    endSession();
    const observer = new MutationObserver(scheduleCheck);
    session = { handle, observer, reported: false, decided: false, awaitingFollow: false };
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-testid"] });
    // 読み込みが終わらないページ（エラー表示など）は判定をあきらめて残す
    const current = session;
    current.detectTimer = setTimeout(() => (current.decided = true), DETECT_TIMEOUT_MS);
    check();
  }

  function onUrlMaybeChanged() {
    const handle = settings.enabled ? H.profileHandle(location.href) : null;
    if (handle === (session?.handle ?? null)) return;
    if (handle) startSession(handle);
    else endSession();
  }

  // ---- 人のクリックを聞く（押すのは常に人） ----

  document.addEventListener(
    "click",
    (ev) => {
      const current = session;
      if (!current || current.reported || !settings.enabled || !(ev.target instanceof Element)) return;
      const clicked = ev.target.closest("[data-testid]");
      if (!clicked || !FOLLOW_BUTTON_TESTID.test(clicked.getAttribute("data-testid"))) return;
      if (clicked !== H.profileFollowButton(document, current.handle)) return; // おすすめ欄などのフォローは対象外
      rememberClick(current.handle);
      // 表示が「フォロー中」に変わるまで待つ（回線が遅くても取りこぼさないよう、期限は設けない）
      current.awaitingFollow = true;
    },
    true,
  );

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    const next = Object.fromEntries(Object.entries(changes).map(([key, { newValue }]) => [key, newValue]));
    settings = H.normalizeSettings({ ...settings, ...next });
    if (!settings.enabled) endSession();
    else onUrlMaybeChanged();
  });

  // X は画面遷移でページを読み直さないので、URL の変化を見て判定し直す
  setInterval(onUrlMaybeChanged, URL_CHECK_MS);

  H.loadSettings()
    .then((loaded) => {
      settings = loaded;
      onUrlMaybeChanged();
    })
    .catch(() => toast("設定を読み込めませんでした。"));
})();
