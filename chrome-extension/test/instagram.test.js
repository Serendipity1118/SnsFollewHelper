import { describe, expect, test, vi } from "vitest";
import "../src/profileUrl.js";
import "../src/detect.js";
import "../src/report.js";

const { profileTarget, instagramHandle, detect, detectInstagramProfile, isFollowClick, reportResult, isReportablePlatform } =
  globalThis.FollowHelper;

/** Instagram のプロフィール画面を模した最小限の DOM（2026-10 時点の構造: main > header に h2 とボタン）。 */
function igPage(handle, buttonText, extra = "") {
  document.body.innerHTML = `
    <main>
      <header>
        <section><h2>${handle}</h2></section>
        <section>
          <button type="button"><div><div>${buttonText}</div></div></button>
          <div role="button">メッセージ</div>
        </section>
        <section>${extra}</section>
      </header>
    </main>`;
  return document;
}

describe("Instagram profile URLs", () => {
  test("reads handles with dots and underscores", () => {
    expect(instagramHandle("https://www.instagram.com/Ai.Chan_1/")).toBe("ai.chan_1");
    expect(instagramHandle("https://instagram.com/boo__b?igsh=1")).toBe("boo__b");
  });

  test("ignores Instagram's own pages and sub pages", () => {
    for (const url of [
      "https://www.instagram.com/",
      "https://www.instagram.com/explore/",
      "https://www.instagram.com/p/Cabc/",
      "https://www.instagram.com/reels/",
      "https://www.instagram.com/_u/",
      "https://www.instagram.com/direct/inbox/",
      "https://www.instagram.com/alice/reels/",
      "https://www.instagram.com/%E3%81%82",
      "https://www.instagram.com/%E0%A4%A",
      "not a url",
      "https://example.com/alice",
    ]) {
      expect(instagramHandle(url)).toBeNull();
    }
  });

  test("profileTarget tells the platform", () => {
    expect(profileTarget("https://x.com/alice")).toEqual({ platform: "x", handle: "alice" });
    expect(profileTarget("https://www.instagram.com/ai.chan/")).toEqual({ platform: "instagram", handle: "ai.chan" });
    expect(profileTarget("https://www.instagram.com/explore/")).toBeNull();
  });
});

describe("detectInstagramProfile", () => {
  test.each([
    ["フォロー", "unfollowed"],
    ["フォローバックする", "unfollowed"],
    ["Follow", "unfollowed"],
    ["フォロー中", "followed"],
    ["Following", "followed"],
    ["リクエスト済み", "pending"],
    ["Requested", "pending"],
  ])("reads the %s button as %s", (text, expected) => {
    expect(detectInstagramProfile(igPage("alice", text), "alice")).toBe(expected);
    expect(detect(document, "instagram", "alice")).toBe(expected);
  });

  test("reports missing accounts", () => {
    document.body.innerHTML =
      "<main><div><span>このページはご利用いただけません。</span><span>リンクに問題があるか、ページが削除された可能性があります。</span></div></main>";
    expect(detectInstagramProfile(document, "ghost")).toBe("not_found");
    document.body.innerHTML = "<main><span>Sorry, this page isn't available.</span></main>";
    expect(detectInstagramProfile(document, "ghost")).toBe("not_found");
  });

  test("waits while the page is loading or still shows the previous profile", () => {
    document.body.innerHTML = "<div>loading</div>";
    expect(detectInstagramProfile(document, "alice")).toBe("unknown");
    expect(detectInstagramProfile(igPage("bob", "フォロー中"), "alice")).toBe("unknown");
  });

  test("uses the profile's own button, not suggested accounts", () => {
    const doc = igPage("alice", "フォロー中", '<h2>同じようなアカウント</h2><button type="button">フォロー</button>');
    expect(detectInstagramProfile(doc, "alice")).toBe("followed");
  });
});

describe("isFollowClick on Instagram", () => {
  test("accepts only the profile's own Follow button", () => {
    igPage("alice", "フォロー", '<button type="button" id="suggested">フォロー</button>');
    const own = document.querySelector("header button div div");
    expect(isFollowClick(document, "instagram", "alice", own)).toBe(true);
    expect(isFollowClick(document, "instagram", "alice", document.getElementById("suggested"))).toBe(false);
    expect(isFollowClick(document, "instagram", "alice", document.querySelector('[role="button"]'))).toBe(false);
  });

  test("ignores clicks on Following (unfollow menu)", () => {
    igPage("alice", "フォロー中");
    expect(isFollowClick(document, "instagram", "alice", document.querySelector("header button"))).toBe(false);
  });
});

describe("reporting Instagram results", () => {
  test("PUTs to the Instagram API", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ status: 200, ok: true });
    expect(await reportResult(fetchFn, "http://127.0.0.1:8787", "Ai.Chan", "済", "instagram")).toEqual({
      close: true,
      recorded: true,
    });
    expect(fetchFn.mock.calls[0][0]).toBe("http://127.0.0.1:8787/api/ig/targets/ai.chan/status");
  });

  test("rejects unknown platforms without sending", async () => {
    const fetchFn = vi.fn();
    expect(await reportResult(fetchFn, "http://127.0.0.1:8787", "a", "済", "toString")).toMatchObject({ close: false });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(isReportablePlatform("x")).toBe(true);
    expect(isReportablePlatform("instagram")).toBe(true);
    expect(isReportablePlatform("__proto__")).toBe(false);
  });
});
