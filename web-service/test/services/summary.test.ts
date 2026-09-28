import { describe, expect, test } from "vitest";
import { QueueError } from "../../src/services/queueService";
import { createTestService, fixture } from "../support";

/** 個人: 未9・済1（alice_1, 2026-09-01）・スキップ1。時計は 2026-09-28。 */
function seeded() {
  const ctx = createTestService();
  ctx.service.importQueue(fixture("existing_queue.csv"), "personal");
  ctx.service.importCasts(fixture("casts.csv"));
  return ctx;
}

describe("summary", () => {
  test("reports follows against the 5,000 cap and what is left in the list", () => {
    const { service } = seeded();
    const summary = service.summary();
    expect(summary).toMatchObject({ followed: 1, followCap: 5000, pending: 9 });
    expect(summary.pendingTop[0]).toEqual({ prefecture: "tokyo", label: "東京", count: 4 });
  });

  test("warm-up starts from the first follow unless a start date is set", () => {
    const { service } = seeded();
    expect(service.summary().warmup).toEqual({ startDate: "2026-09-01", auto: true, week: 4, min: 30, max: 40 });

    service.updateSettings({ operationStartDate: "2026-09-25" });
    expect(service.summary().warmup).toEqual({ startDate: "2026-09-25", auto: false, week: 1, min: 10, max: 15 });

    service.updateSettings({ operationStartDate: "" });
    expect(service.summary().warmup?.auto).toBe(true);
  });

  test("has no warm-up week before the first follow", () => {
    const { service } = createTestService();
    service.importCasts(fixture("casts.csv"));
    expect(service.summary().warmup).toBeNull();
  });

  test("today() carries the summary and Japanese prefecture labels", () => {
    const { service } = seeded();
    const today = service.assignNext();
    expect(today.summary.pending).toBe(0);
    expect(today.items.find((i) => i.handle === "dave")?.prefectureLabel).toBe("北海道");
    expect(service.mark("frank", "済").item.prefectureLabel).toBe("東京");
  });
});

describe("operationStartDate setting", () => {
  test("defaults to automatic and rejects malformed dates", () => {
    const { service } = createTestService();
    expect(service.settings().operationStartDate).toBe("");
    expect(() => service.updateSettings({ operationStartDate: "9/1" })).toThrow(QueueError);
    expect(() => service.updateSettings({ operationStartDate: "2026-13-40" })).toThrow(QueueError);
  });
});

describe("list search", () => {
  test("matches handle, cast name and shop", () => {
    const { service } = seeded();
    const handles = (q: string) => service.list({ kind: "personal", q, page: 1, pageSize: 50 }).items.map((i) => i.handle);
    expect(handles("shopf")).toEqual(["frank", "gina"]);
    expect(handles("<b>た")).toEqual(["kate"]);
    expect(handles("CAROL")).toEqual(["carol"]);
  });

  test("treats LIKE wildcards literally", () => {
    const { service } = seeded();
    expect(service.list({ kind: "personal", q: "%", page: 1, pageSize: 50 }).total).toBe(0);
  });

  test("lists prefectures of a kind with labels, busiest first", () => {
    const { service } = seeded();
    const prefs = service.targetPrefectures("personal");
    expect(prefs[0]).toEqual({ prefecture: "tokyo", label: "東京", count: 5 });
    expect(prefs.map((p) => p.prefecture)).toContain("_hokkaido");
  });
});
