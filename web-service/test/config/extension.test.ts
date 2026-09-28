import { describe, expect, test } from "vitest";
import { DEFAULT_EXTENSION_ID, extensionOrigin } from "../../src/config/extension";

describe("extensionOrigin", () => {
  test("uses the fixed ID from manifest.json by default", () => {
    expect(extensionOrigin(undefined)).toBe(`chrome-extension://${DEFAULT_EXTENSION_ID}`);
    expect(extensionOrigin("")).toBe(`chrome-extension://${DEFAULT_EXTENSION_ID}`);
  });

  test("accepts an override from EXTENSION_ID", () => {
    expect(extensionOrigin("ABCDEFGHIJKLMNOPABCDEFGHIJKLMNOP")).toBe("chrome-extension://abcdefghijklmnopabcdefghijklmnop");
  });

  test("rejects values that are not extension IDs", () => {
    expect(() => extensionOrigin("evil.example")).toThrow("EXTENSION_ID");
    expect(() => extensionOrigin("z".repeat(32))).toThrow("EXTENSION_ID");
  });
});
