import { describe, expect, test, vi } from "vitest";
import "../src/report.js";

const { reportResult, STATUS_FOR } = globalThis.FollowHelper;

const SERVER = "http://127.0.0.1:8787";
const response = (status) => ({ status, ok: status >= 200 && status < 300 });

describe("STATUS_FOR", () => {
  test("maps detections to the web service's stored statuses", () => {
    expect(STATUS_FOR).toEqual({
      followed_now: "済",
      followed: "既フォロー",
      pending: "既フォロー",
      not_found: "死垢",
      suspended: "死垢",
    });
  });
});

describe("isReportableHandle", () => {
  test("accepts any list value that fits in one path segment", () => {
    const { isReportableHandle } = globalThis.FollowHelper;
    expect(isReportableHandle("alice_01")).toBe(true);
    expect(isReportableHandle("%20high_puri_mikii")).toBe(true);
    expect(isReportableHandle("%e3%81%bf%e3%81%95@cafe&bar19")).toBe(true);
    expect(isReportableHandle("")).toBe(false);
    expect(isReportableHandle("a/b")).toBe(false);
    expect(isReportableHandle("a".repeat(201))).toBe(false);
    expect(isReportableHandle(42)).toBe(false);
  });
});

describe("reportResult", () => {
  test("PUTs the status and closes the tab when saved", async () => {
    const fetchFn = vi.fn().mockResolvedValue(response(200));
    expect(await reportResult(fetchFn, SERVER, "Alice", "済")).toEqual({ close: true, recorded: true });
    expect(fetchFn).toHaveBeenCalledWith(`${SERVER}/api/targets/alice/status`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "済" }),
    });
  });

  test("closes the tab without recording when the handle is not in the list", async () => {
    const fetchFn = vi.fn().mockResolvedValue(response(404));
    expect(await reportResult(fetchFn, SERVER, "bob", "既フォロー")).toEqual({ close: true, recorded: false });
  });

  test("keeps the tab open when the server rejects the request", async () => {
    const fetchFn = vi.fn().mockResolvedValue(response(403));
    expect(await reportResult(fetchFn, SERVER, "bob", "済")).toEqual({
      close: false,
      error: "Webサービスが受け付けませんでした（HTTP 403）",
    });
  });

  test("keeps the tab open when the server is down", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await reportResult(fetchFn, SERVER, "bob", "済")).toEqual({
      close: false,
      error: "Webサービスに接続できませんでした。起動しているか確認してください。",
    });
  });

  test("encodes the handle in the path", async () => {
    const fetchFn = vi.fn().mockResolvedValue(response(200));
    await reportResult(fetchFn, SERVER, "a/b", "済");
    expect(fetchFn.mock.calls[0][0]).toBe(`${SERVER}/api/targets/a%2Fb/status`);
  });
});
