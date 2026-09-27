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
