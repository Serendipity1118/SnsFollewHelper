import { describe, expect, test } from "vitest";
import { prefectureLabel } from "../../src/domain/prefectures";
import { statusLabel } from "../../src/domain/statusLabels";
import { warmupGuide } from "../../src/domain/warmup";

describe("prefectureLabel", () => {
  test("translates pokepara slugs, including underscore-prefixed ones", () => {
    expect(prefectureLabel("tokyo")).toBe("東京");
    expect(prefectureLabel("_hokkaido")).toBe("北海道");
    expect(prefectureLabel("_okinawa")).toBe("沖縄");
  });

  test("falls back to the raw value for unknown slugs", () => {
    expect(prefectureLabel("atlantis")).toBe("atlantis");
    expect(prefectureLabel("")).toBe("");
  });
});

describe("statusLabel", () => {
  test("describes stored statuses as actions", () => {
    expect(statusLabel("済")).toBe("フォローした");
    expect(statusLabel("スキップ")).toBe("見送り");
    expect(statusLabel("当日")).toBe("今日の名簿");
    expect(statusLabel("未")).toBe("未着手");
  });

  test("keeps unknown statuses as they are", () => {
    expect(statusLabel("保留")).toBe("保留");
  });
});

describe("warmupGuide", () => {
  test("week 1 starts on the start date", () => {
    expect(warmupGuide("2026-09-01", "2026-09-01")).toEqual({ week: 1, min: 10, max: 15 });
    expect(warmupGuide("2026-09-01", "2026-09-07")).toEqual({ week: 1, min: 10, max: 15 });
  });

  test("week 2 and week 3+ follow the documented pace", () => {
    expect(warmupGuide("2026-09-01", "2026-09-08")).toEqual({ week: 2, min: 20, max: 25 });
    expect(warmupGuide("2026-09-01", "2026-09-15")).toEqual({ week: 3, min: 30, max: 40 });
    expect(warmupGuide("2026-08-18", "2026-09-28")).toEqual({ week: 6, min: 30, max: 40 });
  });

  test("a future start date counts as week 1", () => {
    expect(warmupGuide("2026-10-01", "2026-09-28")).toEqual({ week: 1, min: 10, max: 15 });
  });

  test("returns null for malformed dates", () => {
    expect(warmupGuide("someday", "2026-09-28")).toBeNull();
  });
});
