// @vitest-environment-options {"url":"https://www.instagram.com/"}
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import "../src/settings.js";
import "../src/profileUrl.js";
import "../src/detect.js";

const DETECT_WAIT_MS = 200; // debounce(150ms) より長く
const CLOSE_DELAY_MS = 1500;
const AUTO_CLOSE_DELAY_MS = 15_000;

const sendMessage = vi.fn();

function profile(handle, buttonText) {
  document.body.innerHTML = `<main><header><h2>${handle}</h2><button type="button"><div><div id="label">${buttonText}</div></div></button></header></main>`;
}

async function visit(handle, render) {
  render();
  history.pushState({}, "", `/${handle}/`);
  await vi.advanceTimersByTimeAsync(1000 + DETECT_WAIT_MS);
}

/** 人のクリックと、Instagram がボタンの文字だけを書き換える変化を再現する（テスト側の操作。拡張は押さない）。 */
async function humanClicksFollow(nextText) {
  const label = document.getElementById("label");
  label.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  label.firstChild.textContent = nextText;
  await vi.advanceTimersByTimeAsync(DETECT_WAIT_MS);
}

beforeAll(async () => {
  vi.useFakeTimers();
  globalThis.chrome = {
    runtime: { sendMessage },
    storage: { local: { get: vi.fn().mockResolvedValue({}) }, onChanged: { addListener: () => {} } },
  };
  document.body.innerHTML = "";
  new Function(readFileSync(resolve(process.cwd(), "src", "content.js"), "utf8"))();
  await vi.advanceTimersByTimeAsync(0);
});

afterAll(() => vi.useRealTimers());

beforeEach(() => {
  sendMessage.mockReset().mockResolvedValue({ close: true, recorded: true });
});

const reported = (handle, kind) => ({ type: "report", platform: "instagram", handle, kind });

describe("content script on Instagram", () => {
  test("reports already-followed profiles with the Instagram platform", async () => {
    await visit("ai.chan", () => profile("ai.chan", "フォロー中"));
    await vi.advanceTimersByTimeAsync(AUTO_CLOSE_DELAY_MS);
    expect(sendMessage).toHaveBeenCalledWith(reported("ai.chan", "followed"));
  });

  test("reports missing accounts", async () => {
    await visit("ghost.x", () => {
      document.body.innerHTML = "<main><span>このページはご利用いただけません。</span></main>";
    });
    await vi.advanceTimersByTimeAsync(AUTO_CLOSE_DELAY_MS);
    expect(sendMessage).toHaveBeenCalledWith(reported("ghost.x", "not_found"));
  });

  test("after the person clicks Follow, reports once the button text changes", async () => {
    await visit("boo__b", () => profile("boo__b", "フォロー"));
    await vi.advanceTimersByTimeAsync(AUTO_CLOSE_DELAY_MS);
    expect(sendMessage).not.toHaveBeenCalled();

    await humanClicksFollow("フォロー中");
    await vi.advanceTimersByTimeAsync(CLOSE_DELAY_MS + 100);
    expect(sendMessage).toHaveBeenCalledWith(reported("boo__b", "followed_now"));
  });

  test("private accounts become リクエスト済み and are reported as followed now", async () => {
    await visit("secret", () => profile("secret", "フォロー"));
    await humanClicksFollow("リクエスト済み");
    await vi.advanceTimersByTimeAsync(CLOSE_DELAY_MS + 100);
    expect(sendMessage).toHaveBeenCalledWith(reported("secret", "followed_now"));
  });
});
