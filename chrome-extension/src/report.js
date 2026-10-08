// 判定結果を Web サービスへ知らせる。service worker から importScripts で読み込む。
(() => {
  "use strict";

  /** 判定 → Webサービスに保存する状態（web-service/src/domain/constants.ts と同じ値）。 */
  const STATUS_FOR = Object.freeze({
    followed_now: "済",
    followed: "既フォロー",
    pending: "既フォロー",
    not_found: "死垢",
    suspended: "死垢",
  });

  const HTTP_NOT_FOUND = 404;
  /** プラットフォーム → Webサービスの API の前置き（web-service/src/domain/platform.ts の apiBase）。 */
  const API_BASE = Object.freeze({ x: "/api", instagram: "/api/ig" });
  const MAX_HANDLE_LENGTH = 200;

  /** 結果を送れるプラットフォームか（"toString" などの継承プロパティは不可）。 */
  function isReportablePlatform(platform) {
    return typeof platform === "string" && Object.hasOwn(API_BASE, platform);
  }

  /** 名簿の handle として送ってよい値か（1つのパス要素に収まる文字列。送信時は encodeURIComponent する）。 */
  function isReportableHandle(handle) {
    return typeof handle === "string" && handle.length > 0 && handle.length <= MAX_HANDLE_LENGTH && !handle.includes("/");
  }

  /**
   * @param {typeof fetch} fetchFn
   * @param {string} serverUrl
   * @param {string} handle
   * @param {string} status
   * @param {"x" | "instagram"} [platform]
   * @returns {Promise<{ close: true, recorded: boolean } | { close: false, error: string }>}
   *   名簿にない handle（404）は記録せずにタブを閉じる。それ以外の失敗はタブを残す。
   */
  async function reportResult(fetchFn, serverUrl, handle, status, platform = "x") {
    if (!isReportablePlatform(platform)) return { close: false, error: "不正な判定結果です。" };
    const url = `${serverUrl}${API_BASE[platform]}/targets/${encodeURIComponent(handle.toLowerCase())}/status`;
    let res;
    try {
      res = await fetchFn(url, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      return { close: false, error: "Webサービスに接続できませんでした。起動しているか確認してください。" };
    }
    if (res.ok) return { close: true, recorded: true };
    if (res.status === HTTP_NOT_FOUND) return { close: true, recorded: false };
    return { close: false, error: `Webサービスが受け付けませんでした（HTTP ${res.status}）` };
  }

  globalThis.FollowHelper = { ...globalThis.FollowHelper, API_BASE, STATUS_FOR, isReportableHandle, isReportablePlatform, reportResult };
})();
