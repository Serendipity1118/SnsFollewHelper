// service worker。判定結果を Web サービスへ知らせ、保存できたらタブを閉じる。ツールバーのアイコンで ON/OFF を切り替える。
importScripts("settings.js", "report.js");

const H = globalThis.FollowHelper;
const BADGE = { on: { text: "ON", color: "#1d9bf0" }, off: { text: "OFF", color: "#8b98a5" } };

async function updateBadge() {
  const { enabled } = await H.loadSettings();
  const badge = enabled ? BADGE.on : BADGE.off;
  await chrome.action.setBadgeText({ text: badge.text });
  await chrome.action.setBadgeBackgroundColor({ color: badge.color });
  await chrome.action.setTitle({ title: `フォロー補助: ${enabled ? "ON" : "OFF"}（クリックで切り替え）` });
}

async function handleReport(message, sender) {
  const tabId = sender.tab?.id;
  const status = H.STATUS_FOR[message.kind];
  const platform = message.platform ?? "x";
  if (tabId === undefined || !status || !H.isReportableHandle(message.handle) || !H.isReportablePlatform(platform)) {
    return { close: false, error: "不正な判定結果です。" };
  }
  const settings = await H.loadSettings();
  if (!settings.enabled) return { close: false, error: null };
  const result = await H.reportResult(fetch, settings.serverUrl, message.handle, status, platform);
  if (result.close) await chrome.tabs.remove(tabId);
  return result;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || message?.type !== "report") return false;
  handleReport(message, sender)
    .then(sendResponse)
    .catch((error) => sendResponse({ close: false, error: `タブを閉じられませんでした: ${error.message}` }));
  return true; // 非同期で応答する
});

chrome.action.onClicked.addListener(async () => {
  const { enabled } = await H.loadSettings();
  await chrome.storage.local.set({ enabled: !enabled });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && "enabled" in changes) updateBadge();
});

chrome.runtime.onInstalled.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);
