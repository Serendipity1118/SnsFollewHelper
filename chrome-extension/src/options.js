// オプション画面。値は settings.js の normalizeSettings を通してから保存する。
(() => {
  "use strict";

  const H = globalThis.FollowHelper;
  const $ = (id) => document.getElementById(id);
  const SAVED_MS = 2000;

  function show(settings) {
    $("enabled").checked = settings.enabled;
    $("delay").value = String(settings.closeDelayMs / 1000);
    $("autoDelay").value = String(settings.autoCloseDelayMs / 1000);
    $("server").value = settings.serverUrl;
  }

  $("form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const settings = H.normalizeSettings({
      enabled: $("enabled").checked,
      closeDelayMs: Math.round(Number($("delay").value) * 1000),
      autoCloseDelayMs: Math.round(Number($("autoDelay").value) * 1000),
      serverUrl: $("server").value.trim() || undefined,
    });
    await chrome.storage.local.set(settings);
    show(settings);
    $("saved").hidden = false;
    setTimeout(() => ($("saved").hidden = true), SAVED_MS);
  });

  H.loadSettings().then(show);
})();
