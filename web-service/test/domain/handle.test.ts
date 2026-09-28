import { describe, expect, test } from "vitest";
import { normalizeHandle } from "../../src/domain/handle";
import { parseUpdateDate } from "../../src/domain/dates";

describe("normalizeHandle", () => {
  test.each([
    ["https://x.com/Alice_1", "alice_1"],
    ["https://twitter.com/alice_1?s=20", "alice_1"],
    ["https://x.com/#!/bob", "bob"],
    ["https://x.com/@carol/status/123", "carol"],
    ["https://mobile.twitter.com/dave", "dave"],
    ["  https://X.COM/Eve/  ", "eve"],
  ])("extracts handle from %s", (url, expected) => {
    expect(normalizeHandle(url)).toBe(expected);
  });

  // 2026-09-28 に名簿で見つかった崩れた値（空白・全角＠・全角＿が URL エンコードされて混ざる）
  test.each([
    ["https://x.com/%20high_puri_mikii", "high_puri_mikii"],
    ["https://x.com/kimikite_kohaku%20", "kimikite_kohaku"],
    ["https://x.com/ookami%20_miku3", "ookami_miku3"],
    ["https://x.com/%20@barkuramo9966", "barkuramo9966"],
    ["https://x.com/%EF%BC%A0lovberry_ice", "lovberry_ice"],
    ["https://x.com/mero%EF%BC%BFhozuki", "mero_hozuki"],
    ["https://x.com/＠aruno_labi", "aruno_labi"],
    ["https://x.com/ yuyu_nachi", "yuyu_nachi"],
  ])("cleans up spaces and full-width characters in %s", (url, expected) => {
    expect(normalizeHandle(url)).toBe(expected);
  });

  test.each([
    ["https://x.com/mole102%E2%80%A6"],
    ["https://x.com/%E3%81%BF%E3%81%95@cafe&bar19"],
    ["https://x.com/%E3%81%AA%E3%81%97"],
    ["https://x.com/haruhi_swerrabbi"],
    ["https://x.com/%E0%A4%A"],
  ])("skips values that cannot be X usernames even after cleaning: %s", (url) => {
    expect(normalizeHandle(url)).toBeNull();
  });

  test.each([
    [undefined],
    [null],
    [""],
    ["   "],
    ["https://instagram.com/foo"],
    ["https://x.com/intent/follow?screen_name=zzz"],
    ["https://x.com/i/flow/login"],
    ["https://x.com/some.name"],
  ])("returns null for %s", (url) => {
    expect(normalizeHandle(url)).toBeNull();
  });
});

describe("parseUpdateDate", () => {
  test("accepts slash, hyphen and dot formats with the same day number", () => {
    const slash = parseUpdateDate("2026/09/05");
    expect(slash).not.toBeNull();
    expect(parseUpdateDate("2026-09-05")).toBe(slash);
    expect(parseUpdateDate("2026.09.05")).toBe(slash);
    expect(parseUpdateDate(" 2026/9/5 ")).toBe(slash);
  });

  test("orders later dates higher", () => {
    expect(parseUpdateDate("2026/09/06")!).toBe(parseUpdateDate("2026/09/05")! + 1);
  });

  test.each([[""], [undefined], ["2026/13/40"], ["2026/02/30"], ["2026/09-05"], ["昨日"]])(
    "returns null for %s",
    (raw) => {
      expect(parseUpdateDate(raw)).toBeNull();
    },
  );
});
