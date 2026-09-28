import { describe, expect, test } from "vitest";
import "../src/profileUrl.js";

const { profileHandle } = globalThis.FollowHelper;

describe("profileHandle", () => {
  test("reads the handle from a profile URL in lowercase", () => {
    expect(profileHandle("https://x.com/Alice_01")).toBe("alice_01");
    expect(profileHandle("https://x.com/alice/")).toBe("alice");
    expect(profileHandle("https://twitter.com/alice?lang=ja")).toBe("alice");
  });

  test("ignores sub pages of a profile", () => {
    expect(profileHandle("https://x.com/alice/status/1")).toBeNull();
    expect(profileHandle("https://x.com/alice/with_replies")).toBeNull();
  });

  test("ignores X's own pages", () => {
    for (const path of ["home", "explore", "notifications", "messages", "i", "settings", "search", "compose", "login"]) {
      expect(profileHandle(`https://x.com/${path}`)).toBeNull();
    }
  });

  test("ignores other sites, files and non-URLs", () => {
    expect(profileHandle("https://example.com/alice")).toBeNull();
    expect(profileHandle("https://x.com/")).toBeNull();
    expect(profileHandle("https://x.com/a.b")).toBeNull();
    expect(profileHandle("not a url")).toBeNull();
  });

  test("returns the list's own value for handles X cannot show (opened via /go/<handle>)", () => {
    // 名簿の値 "%20high_puri_mikii" は x.com/%2520high_puri_mikii として開かれる
    expect(profileHandle("https://x.com/%2520high_puri_mikii")).toBe("%20high_puri_mikii");
    expect(profileHandle("https://x.com/%25ef%25bc%25a0lovberry_ice")).toBe("%ef%bc%a0lovberry_ice");
    expect(profileHandle("https://x.com/" + "a".repeat(16))).toBe("a".repeat(16));
    expect(profileHandle("https://x.com/%E3%81%AA%E3%81%97")).toBe("なし");
  });
});
