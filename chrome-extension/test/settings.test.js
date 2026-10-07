import { describe, expect, test } from "vitest";
import "../src/settings.js";

const { DEFAULT_SETTINGS, normalizeSettings } = globalThis.FollowHelper;

describe("normalizeSettings", () => {
  test("fills in defaults", () => {
    expect(DEFAULT_SETTINGS).toEqual({
      enabled: true,
      closeDelayMs: 1500,
      autoCloseDelayMs: 15000,
      serverUrl: "http://127.0.0.1:8787",
    });
    expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  test("keeps valid values", () => {
    expect(
      normalizeSettings({ enabled: false, closeDelayMs: 3000, autoCloseDelayMs: 30000, serverUrl: "http://localhost:9000/" }),
    ).toEqual({
      enabled: false,
      closeDelayMs: 3000,
      autoCloseDelayMs: 30000,
      serverUrl: "http://localhost:9000",
    });
  });

  test("clamps the delay", () => {
    expect(normalizeSettings({ closeDelayMs: -5 }).closeDelayMs).toBe(0);
    expect(normalizeSettings({ closeDelayMs: 999999 }).closeDelayMs).toBe(10000);
    expect(normalizeSettings({ closeDelayMs: "abc" }).closeDelayMs).toBe(1500);
  });

  test("clamps the auto-close delay to 0-60 seconds", () => {
    expect(normalizeSettings({ autoCloseDelayMs: -5 }).autoCloseDelayMs).toBe(0);
    expect(normalizeSettings({ autoCloseDelayMs: 0 }).autoCloseDelayMs).toBe(0);
    expect(normalizeSettings({ autoCloseDelayMs: 999999 }).autoCloseDelayMs).toBe(60000);
    expect(normalizeSettings({ autoCloseDelayMs: "abc" }).autoCloseDelayMs).toBe(15000);
  });

  test("only accepts local servers", () => {
    expect(normalizeSettings({ serverUrl: "https://evil.example" }).serverUrl).toBe("http://127.0.0.1:8787");
    expect(normalizeSettings({ serverUrl: "http://127.0.0.1.evil.example" }).serverUrl).toBe("http://127.0.0.1:8787");
    expect(normalizeSettings({ serverUrl: "not a url" }).serverUrl).toBe("http://127.0.0.1:8787");
    expect(normalizeSettings({ serverUrl: "http://127.0.0.1:8787/path?q=1" }).serverUrl).toBe("http://127.0.0.1:8787");
  });
});
