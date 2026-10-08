// X / Instagram のページで動く。プロフィールを読み取って判定し、結果を service worker へ渡す（タブを閉じるのは service worker）。
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
  // X はボタンの data-testid が、Instagram はボタンの文字が切り替わる
  const OBSERVE = {
    x: { childList: true, subtree: true, attributes: true, attributeFilter: ["data-testid"] },
    instagram: { childList: true, subtree: true, characterData: true },
  };
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
      result = await chrome.runtime.sendMessage({ type: "report", platform: current.platform, handle: current.handle, kind });
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

  /**
   * delayMs 待ってから、表示がまだ expected のどれかなら kind で知らせる（＝タブを閉じる）。
   * 待ち時間中にフォロー解除・再読み込みなどで表示が変わったら何もしない。
   */
  function scheduleClose(kind, delayMs, expected) {
    const current = session;
    clearTimeout(current.closeTimer);
    current.closeTimer = setTimeout(() => {
      if (session !== current || !settings.enabled) return;
      if (expected.has(H.detect(document, current.platform, current.handle))) report(kind);
    }, delayMs);
  }

  /** 開いた時点で決まった状態（存在しない・凍結・フォロー済み）のタブを、設定の秒数だけ待ってから閉じる。 */
  function scheduleAutoClose(state) {
    if (!FOLLOWING.has(state)) {
      scheduleClose(state, settings.autoCloseDelayMs, new Set([state]));
      return;
    }
    // フォローを押した後に記録に失敗して再読み込みしたタブは「済」として、フォロー直後と同じ秒数で閉じる
    if (wasClicked(session.handle)) scheduleClose("followed_now", settings.closeDelayMs, FOLLOWING);
    else scheduleClose(state, settings.autoCloseDelayMs, FOLLOWING);
  }

  function check() {
    const current = session;
    if (!current || current.reported || !settings.enabled) return;
    const state = H.detect(document, current.platform, current.handle);
    if (current.awaitingFollow) {
      if (FOLLOWING.has(state)) {
        current.awaitingFollow = false;
        scheduleClose("followed_now", settings.closeDelayMs, FOLLOWING);
      }
      return;
    }
    if (current.decided) return;
    if (!DECISIVE.has(state) && state !== "unfollowed") return;
    current.decided = true;
    clearTimeout(current.detectTimer);
    if (state === "unfollowed") return; // 未フォローのタブは残す
    scheduleAutoClose(state);
  }

  function scheduleCheck() {
    if (!session) return;
    clearTimeout(session.debounce);
    session.debounce = setTimeout(check, DEBOUNCE_MS);
  }

  function startSession({ platform, handle }) {
    endSession();
    const observer = new MutationObserver(scheduleCheck);
    session = { platform, handle, observer, reported: false, decided: false, awaitingFollow: false };
    observer.observe(document.body, OBSERVE[platform]);
    // 読み込みが終わらないページ（エラー表示など）は判定をあきらめて残す
    const current = session;
    current.detectTimer = setTimeout(() => (current.decided = true), DETECT_TIMEOUT_MS);
    check();
  }

  function onUrlMaybeChanged() {
    const target = settings.enabled ? H.profileTarget(location.href) : null;
    if (target?.handle === session?.handle && target?.platform === session?.platform) return;
    if (target) startSession(target);
    else endSession();
  }

  // ---- 人のクリックを聞く（押すのは常に人） ----

  document.addEventListener(
    "click",
    (ev) => {
      const current = session;
      if (!current || current.reported || !settings.enabled || !(ev.target instanceof Element)) return;
      if (!H.isFollowClick(document, current.platform, current.handle, ev.target)) return; // おすすめ欄などは対象外
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

  // X も Instagram も画面遷移でページを読み直さないので、URL の変化を見て判定し直す
  setInterval(onUrlMaybeChanged, URL_CHECK_MS);

  H.loadSettings()
    .then((loaded) => {
      settings = loaded;
      onUrlMaybeChanged();
    })
    .catch(() => toast("設定を読み込めませんでした。"));
})();
