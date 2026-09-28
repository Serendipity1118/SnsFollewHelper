// 拡張の設定（chrome.storage.local）。content script・service worker・オプション画面で共有する。
(() => {
  "use strict";

  const DEFAULT_SERVER = "http://127.0.0.1:8787";
  const MAX_DELAY_MS = 10_000;
  const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

  const DEFAULT_SETTINGS = Object.freeze({ enabled: true, closeDelayMs: 1500, serverUrl: DEFAULT_SERVER });

  /** ローカルの http サーバーだけを許可する（結果を外部へ送らない）。 */
  function localServer(raw) {
    try {
      const url = new URL(String(raw));
      return url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname) ? url.origin : DEFAULT_SERVER;
    } catch {
      return DEFAULT_SERVER;
    }
  }

  function delay(raw) {
    const ms = Number(raw);
    if (raw === undefined || raw === null || raw === "" || !Number.isFinite(ms)) return DEFAULT_SETTINGS.closeDelayMs;
    return Math.min(MAX_DELAY_MS, Math.max(0, Math.round(ms)));
  }

  /**
   * @param {Record<string, unknown> | undefined} raw
   * @returns {{ enabled: boolean, closeDelayMs: number, serverUrl: string }}
   */
  function normalizeSettings(raw = {}) {
    const input = raw ?? {};
    return {
      enabled: typeof input.enabled === "boolean" ? input.enabled : DEFAULT_SETTINGS.enabled,
      closeDelayMs: delay(input.closeDelayMs),
      serverUrl: input.serverUrl === undefined ? DEFAULT_SERVER : localServer(input.serverUrl),
    };
  }

  async function loadSettings() {
    return normalizeSettings(await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS)));
  }

  globalThis.FollowHelper = { ...globalThis.FollowHelper, DEFAULT_SETTINGS, normalizeSettings, loadSettings };
})();
