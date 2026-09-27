import { describe, expect, test } from "vitest";
import { CsvFormatError } from "../../src/csv/parse";
import { QueueError } from "../../src/services/queueService";
import { createTestService, fixture, MINUTE_MS } from "../support";

const DAY = 24 * 60 * MINUTE_MS;

function seeded() {
  const ctx = createTestService();
  ctx.service.importQueue(fixture("existing_queue.csv"), "personal");
  ctx.service.importCasts(fixture("casts.csv"));
  return ctx;
}

const lines = (csv: string) => csv.trimEnd().split("\r\n");

describe("importCasts", () => {
  test("builds the queue, keeps statuses from the DB and drops vanished handles", () => {
    const { service } = seeded();
    const counts = service.counts();
    expect(counts.personal).toEqual({ 未: 9, 済: 1, スキップ: 1 });
    expect(counts.shop).toEqual({ 店舗垢候補: 1 });
    const page = service.list({ kind: "personal", page: 1, pageSize: 50 });
    expect(page.total).toBe(11);
    expect(page.items.map((i) => i.handle)).not.toContain("gone");
    expect(page.items[0]).toMatchObject({ handle: "frank", priority: 1 });
  });

  test("returns a summary like build_queue.py", () => {
    const { service } = createTestService();
    expect(service.importCasts(fixture("casts.csv"))).toEqual({
      skipped: 4,
      uniqueHandles: 12,
      personal: 11,
      shop: 1,
      pending: 11,
    });
  });

  test("rejects a CSV without the X(Twitter) column", () => {
    const { service } = createTestService();
    expect(() => service.importCasts("a,b\n1,2\n")).toThrow(CsvFormatError);
  });

  test("keeps today's assignment when re-imported", () => {
    const { service } = seeded();
    service.assignNext();
    service.importCasts(fixture("casts.csv"));
    expect(service.today().items).toHaveLength(9);
  });
});

describe("importQueue", () => {
  test("releases stranded 当日 rows back to 未", () => {
    const { service } = createTestService();
    const result = service.importQueue(fixture("existing_queue.csv"), "personal");
    expect(result).toEqual({ imported: 4, released: 1 });
    expect(service.counts().personal).toEqual({ 未: 1, 済: 2, スキップ: 1 });
  });

  test("imports shop candidates into their own kind", () => {
    const { service } = createTestService();
    service.importQueue(fixture("existing_shop.csv"), "shop");
    expect(service.counts().shop).toEqual({ スキップ: 1 });
  });

  test("rejects a CSV without handle/状態", () => {
    const { service } = createTestService();
    expect(() => service.importQueue("foo\n1\n", "personal")).toThrow(CsvFormatError);
  });
});

describe("importResults", () => {
  test("applies only 済/スキップ/死垢 to known handles", () => {
    const { service } = seeded();
    const csv = "﻿handle,状態,実施日\r\nFrank,済,2026-09-20\r\ngina,死垢,\r\nnobody,済,\r\nkate,当日,\r\n";
    const result = service.importResults(csv);
    expect(result).toEqual({ updated: 2, unknown: ["nobody"], ignored: 1 });
    const items = service.list({ kind: "personal", page: 1, pageSize: 50 }).items;
    expect(items.find((i) => i.handle === "frank")).toMatchObject({ status: "済", doneDate: "2026-09-20" });
    expect(items.find((i) => i.handle === "gina")).toMatchObject({ status: "死垢", doneDate: "2026-09-28" });
  });
});

describe("today queue", () => {
  test("assigns the next batch in priority order", () => {
    const { service } = seeded();
    service.updateSettings({ batchSize: 3 });
    const today = service.assignNext();
    expect(today.items.map((i) => i.handle)).toEqual(["frank", "gina", "kate"]);
    expect(today.items.every((i) => i.status === "当日")).toBe(true);
    expect(service.assignNext().items).toHaveLength(6);
  });

  test("releases yesterday's unfinished rows on the next day", () => {
    const { service, clock } = seeded();
    service.updateSettings({ batchSize: 2 });
    service.assignNext();
    service.mark("frank", "済");
    clock.advance(DAY);
    const today = service.today();
    expect(today.items).toHaveLength(0);
    expect(service.counts().personal["当日"]).toBeUndefined();
    expect(service.assignNext().items.map((i) => i.handle)).toEqual(["gina", "kate"]);
  });

  test("releaseAll returns every 当日 row to 未", () => {
    const { service } = seeded();
    service.assignNext();
    expect(service.releaseAll()).toBe(9);
    expect(service.counts().personal["当日"]).toBeUndefined();
  });
});

describe("mark and quota", () => {
  test("saves results immediately and counts new follows", () => {
    const { service } = seeded();
    service.updateSettings({ hourlyLimit: 2, dailyLimit: 10 });
    service.assignNext();
    const first = service.mark("frank", "済");
    expect(first.item).toMatchObject({ status: "済", doneDate: "2026-09-28" });
    expect(first.quota.remaining).toBe(1);
    service.mark("gina", "スキップ");
    expect(service.quota().remaining).toBe(1);
    const second = service.mark("kate", "済");
    expect(second.quota).toMatchObject({ blocked: true, remaining: 0 });
  });

  test("undo returns the row to 当日 without refunding quota", () => {
    const { service } = seeded();
    service.assignNext();
    service.mark("frank", "済");
    const undone = service.mark("frank", "当日");
    expect(undone.item).toMatchObject({ status: "当日", doneDate: "" });
    service.mark("frank", "済");
    expect(service.quota().followed1h).toBe(1);
  });

  test("undoing a result from a previous day re-anchors it to today", () => {
    const { service, clock } = seeded();
    service.assignNext();
    service.mark("frank", "済");
    clock.advance(DAY);
    service.mark("frank", "当日");
    expect(service.today().items.map((i) => i.handle)).toEqual(["frank"]);
  });

  test("shop candidates cannot be marked or opened from the personal flow", () => {
    const { service } = seeded();
    expect(() => service.mark("shopacct", "済")).toThrow(QueueError);
    expect(service.canOpen("shopacct")).toMatchObject({ ok: false, reason: "unknown" });
  });

  test("quota recovers after an hour", () => {
    const { service, clock } = seeded();
    service.updateSettings({ hourlyLimit: 1 });
    service.assignNext();
    service.mark("frank", "済");
    expect(service.quota().blocked).toBe(true);
    clock.advance(60 * MINUTE_MS + 1);
    expect(service.quota().blocked).toBe(false);
  });

  test("rejects unknown handles and statuses", () => {
    const { service } = seeded();
    expect(() => service.mark("nobody", "済")).toThrow(QueueError);
    expect(() => service.mark("frank", "未")).toThrow(QueueError);
  });

  test("canOpen follows the quota and only for known handles", () => {
    const { service } = seeded();
    service.updateSettings({ hourlyLimit: 1 });
    expect(service.canOpen("frank")).toMatchObject({ ok: true });
    expect(service.canOpen("nobody")).toMatchObject({ ok: false, reason: "unknown" });
    service.mark("frank", "済");
    expect(service.canOpen("gina")).toMatchObject({ ok: false, reason: "quota" });
  });
});

describe("settings", () => {
  test("has conservative defaults and validates updates", () => {
    const { service } = createTestService();
    expect(service.settings()).toEqual({ batchSize: 15, hourlyLimit: 15, dailyLimit: 15 });
    expect(service.updateSettings({ dailyLimit: 30 })).toEqual({
      batchSize: 15,
      hourlyLimit: 15,
      dailyLimit: 30,
    });
    expect(() => service.updateSettings({ batchSize: 0 })).toThrow(QueueError);
  });
});

describe("export", () => {
  test("queue export round-trips through importQueue", () => {
    const { service } = seeded();
    const csv = service.exportQueue("personal");
    expect(csv.startsWith("﻿優先度,都道府県,店舗,キャスト名,handle")).toBe(true);
    expect(csv.endsWith("\r\n")).toBe(true);
    const other = createTestService();
    expect(other.service.importQueue(csv, "personal")).toEqual({ imported: 11, released: 0 });
    expect(other.service.counts().personal).toEqual(service.counts().personal);
  });

  test("results export lists finished rows, newest first, optionally for one day", () => {
    const { service } = seeded();
    service.assignNext();
    service.mark("frank", "済");
    expect(lines(service.exportResults())).toEqual([
      "﻿handle,状態,実施日",
      "frank,済,2026-09-28",
      "eve,スキップ,2026-09-02",
      "alice_1,済,2026-09-01",
    ]);
    expect(lines(service.exportResults("2026-09-28"))).toHaveLength(2);
  });

  test("quotes fields that need it", () => {
    const { service } = createTestService();
    service.importCasts(
      "﻿都道府県,店舗名,キャスト名,最終更新日,プロフィールURL,X(Twitter)\n" +
        'tokyo,"Shop, ""A""",a,2026/09/01,,https://x.com/q\n',
    );
    expect(service.exportQueue("personal")).toContain('"Shop, ""A"""');
  });
});
