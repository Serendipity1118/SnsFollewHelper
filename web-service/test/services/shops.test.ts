import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, test } from "vitest";
import { CsvFormatError } from "../../src/csv/parse";
import { openDatabase, SCHEMA_V1 } from "../../src/db/database";
import { createQueueService } from "../../src/services/queueService";
import { createTestService, fixture } from "../support";

function withShops() {
  const ctx = createTestService();
  ctx.service.importCasts(fixture("casts.csv"));
  ctx.service.importShops(fixture("shops.csv"));
  return ctx;
}

const page = { page: 1, pageSize: 50 };

describe("importShops", () => {
  test("replaces the shop list, skipping rows without URL and duplicates", () => {
    const { service } = createTestService();
    expect(service.importShops(fixture("shops.csv"))).toEqual({ imported: 4, skipped: 1, duplicates: 1 });
    expect(service.importShops("店舗名,店舗URL\nOnly,https://shop.example/only\n")).toEqual({
      imported: 1,
      skipped: 0,
      duplicates: 0,
    });
    expect(service.listShops(page).total).toBe(1);
  });

  test("rejects a CSV without 店舗名 / 店舗URL", () => {
    const { service } = createTestService();
    expect(() => service.importShops("a,b\n1,2\n")).toThrow(CsvFormatError);
  });
});

describe("listShops", () => {
  test("orders by prefecture priority then name and attaches queue counts", () => {
    const { service } = withShops();
    service.mark("frank", "済");
    const result = service.listShops(page);
    expect(result.total).toBe(4);
    expect(result.items.map((s) => [s.name, s.queueTotal, s.queuePending, s.queueDone])).toEqual([
      ["ShopA", 1, 1, 0],
      ["ShopF", 2, 1, 1],
      ["ShopS", 0, 0, 0],
      ["ShopB", 2, 2, 0],
    ]);
    expect(result.items[0]).toMatchObject({
      kana: "ショップエー",
      address: "東京都新宿区1-1, 2F",
      xUrl: "https://x.com/shopa",
    });
  });

  test("filters by prefecture and keyword (name, kana, area, address)", () => {
    const { service } = withShops();
    const names = (q: Parameters<typeof service.listShops>[0]) => service.listShops(q).items.map((s) => s.name);
    expect(names({ ...page, prefecture: "osaka" })).toEqual(["ShopB"]);
    expect(names({ ...page, q: "ショップ" })).toEqual(["ShopA"]);
    expect(names({ ...page, q: "新宿区" })).toEqual(["ShopA"]);
    expect(names({ ...page, q: "銀座" })).toEqual(["ShopF"]);
    expect(names({ ...page, q: "%" })).toEqual([]);
    expect(names({ ...page, q: "_" })).toEqual([]);
  });

  test("paginates", () => {
    const { service } = withShops();
    const second = service.listShops({ page: 2, pageSize: 3 });
    expect(second.items.map((s) => s.name)).toEqual(["ShopB"]);
    expect(second.total).toBe(4);
  });

  test("lists prefectures with shop counts in priority order", () => {
    const { service } = withShops();
    expect(service.shopPrefectures()).toEqual([
      { prefecture: "tokyo", count: 3 },
      { prefecture: "osaka", count: 1 },
    ]);
  });
});

describe("queue filter by shop", () => {
  test("narrows the queue list to one shop", () => {
    const { service } = withShops();
    const result = service.list({ kind: "personal", prefecture: "tokyo", shop: "ShopF", page: 1, pageSize: 50 });
    expect(result.items.map((i) => i.handle)).toEqual(["frank", "gina"]);
  });
});

describe("schema migration", () => {
  let dir = "";
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  test("upgrades a v1 database and keeps its data", () => {
    dir = mkdtempSync(join(tmpdir(), "follow-queue-mig-"));
    const path = join(dir, "app.db");
    const v1 = new Database(path);
    v1.exec(SCHEMA_V1);
    v1.prepare("INSERT INTO settings (key, value) VALUES ('dailyLimit', '33')").run();
    v1.pragma("user_version = 1");
    v1.close();

    const db = openDatabase(path);
    const service = createQueueService(db);
    expect(service.settings().dailyLimit).toBe(33);
    expect(service.importShops(fixture("shops.csv")).imported).toBe(4);
    expect(db.pragma("user_version", { simple: true })).toBe(2);
    db.close();
  });
});
