// @vitest-environment-options {"url":"https://x.com/home"}
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import "../src/settings.js";
import "../src/profileUrl.js";
import "../src/detect.js";

const DETECT_WAIT_MS = 200; // debounce(150ms) より長く
const CLOSE_DELAY_MS = 1500;

// jsdom 環境では URL が jsdom のものになるため、パスで解決する
const srcPath = (name) => resolve(process.cwd(), "src", name);
const sendMessage = vi.fn();
let storageListener;

/** content.js をそのまま読み込む（Chrome と同じくクラシックスクリプトとして評価する）。 */
function loadContentScript() {
  const source = readFileSync(srcPath("content.js"), "utf8");
  new Function(source)();
}

function showProfile(primary) {
  document.body.innerHTML = `<main><div data-testid="primaryColumn">${primary}</div></main>`;
}

const header = (testid, handle) =>
  `<div data-testid="placementTracking"><button data-testid="${testid}" aria-label="@${handle}"><span>b</span></button></div>`;

async function visit(handle, primary) {
  showProfile(primary);
  history.pushState({}, "", `/${handle}`);
  await vi.advanceTimersByTimeAsync(1000 + DETECT_WAIT_MS);
}

/** 人がボタンを押し、X が表示を切り替えたときの DOM 変化を再現する（テスト側の操作。拡張は押さない）。 */
async function humanClicksFollow() {
  const button = document.querySelector('[data-testid="1-follow"]');
  button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  button.setAttribute("data-testid", "1-unfollow");
  await vi.advanceTimersByTimeAsync(DETECT_WAIT_MS);
}

beforeAll(async () => {
  vi.useFakeTimers();
  globalThis.chrome = {
    runtime: { sendMessage },
    storage: {
      local: { get: vi.fn().mockResolvedValue({}) },
      onChanged: { addListener: (fn) => (storageListener = fn) },
    },
  };
  showProfile("");
  loadContentScript();
  await vi.advanceTimersByTimeAsync(0);
});

afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  sendMessage.mockReset().mockResolvedValue({ close: true, recorded: true });
});

describe("content script", () => {
  test("reports profiles that are already followed", async () => {
    await visit("alice", header("1-unfollow", "alice"));
    expect(sendMessage).toHaveBeenCalledWith({ type: "report", handle: "alice", kind: "followed" });
  });

  test("reports accounts that do not exist", async () => {
    await visit("carol", '<div data-testid="emptyState">このアカウントは存在しません</div>');
    expect(sendMessage).toHaveBeenCalledWith({ type: "report", handle: "carol", kind: "not_found" });
  });

  test("leaves unfollowed profiles open until the person clicks Follow, then reports after the delay", async () => {
    await visit("bob", header("1-follow", "bob"));
    expect(sendMessage).not.toHaveBeenCalled();

    await humanClicksFollow();
    await vi.advanceTimersByTimeAsync(CLOSE_DELAY_MS - DETECT_WAIT_MS - 100);
    expect(sendMessage).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(300);
    expect(sendMessage).toHaveBeenCalledWith({ type: "report", handle: "bob", kind: "followed_now" });
  });

  test("still reports when X takes a long time to show the follow", async () => {
    await visit("gina", header("1-follow", "gina"));
    document.querySelector('[data-testid="1-follow"]').dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(15_000);
    document.querySelector('[data-testid="1-follow"]').setAttribute("data-testid", "1-unfollow");
    await vi.advanceTimersByTimeAsync(CLOSE_DELAY_MS + DETECT_WAIT_MS + 100);
    expect(sendMessage).toHaveBeenCalledWith({ type: "report", handle: "gina", kind: "followed_now" });
  });

  test("does not report when the person unfollows again during the delay", async () => {
    await visit("dave", header("1-follow", "dave"));
    await humanClicksFollow();
    document.querySelector('[data-testid="1-unfollow"]').setAttribute("data-testid", "1-follow");
    await vi.advanceTimersByTimeAsync(CLOSE_DELAY_MS + DETECT_WAIT_MS);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test("shows the server error and keeps the tab when reporting fails", async () => {
    sendMessage.mockResolvedValue({ close: false, error: "Webサービスに接続できませんでした。" });
    await visit("frank", header("1-unfollow", "frank"));
    expect(document.body.textContent).toContain("Webサービスに接続できませんでした。");
  });

  test("does nothing while turned off", async () => {
    storageListener({ enabled: { newValue: false } }, "local");
    await visit("erin", header("1-unfollow", "erin"));
    expect(sendMessage).not.toHaveBeenCalled();
    storageListener({ enabled: { newValue: true } }, "local");
  });

  test("never clicks or dispatches events itself", () => {
    const sources = ["content.js", "detect.js", "background.js"].map((name) =>
      readFileSync(srcPath(name), "utf8"),
    );
    for (const source of sources) {
      expect(source).not.toMatch(/\.click\(|dispatchEvent|new MouseEvent|new PointerEvent/);
    }
  });
});
