import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { buildQueue, statusMapFromRows } from "../../src/domain/buildQueue";
import { parseCsv } from "../../src/csv/parse";
import { QUEUE_COLUMNS } from "../../src/domain/constants";

const fixture = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), "utf8");

function toQueueCsvRows(rows: ReturnType<typeof buildQueue>["personal"]) {
  return rows.map((r) => ({
    優先度: String(r.priority),
    都道府県: r.prefecture,
    店舗: r.shop,
    キャスト名: r.castName,
    handle: r.handle,
    プロフィールURL: r.profileUrl,
    出現回数: String(r.occurrences),
    最終更新日: r.lastUpdated,
    状態: r.status,
    実施日: r.doneDate,
  }));
}

describe("buildQueue parity with build_queue.py", () => {
  const casts = parseCsv(fixture("casts.csv"));
  const existingPersonal = statusMapFromRows(parseCsv(fixture("existing_queue.csv")));
  const existingShop = statusMapFromRows(parseCsv(fixture("existing_shop.csv")));
  const result = buildQueue(casts, existingPersonal, existingShop);

  test("personal queue matches the Python output row for row", () => {
    const expected = parseCsv(fixture("expected_queue.csv"));
    expect(toQueueCsvRows(result.personal)).toEqual(
      expected.map((row) => Object.fromEntries(QUEUE_COLUMNS.map((c) => [c, row[c] ?? ""]))),
    );
  });

  test("shop candidates match the Python output", () => {
    const expected = parseCsv(fixture("expected_shop.csv"));
    expect(toQueueCsvRows(result.shop)).toEqual(
      expected.map((row) => Object.fromEntries(QUEUE_COLUMNS.map((c) => [c, row[c] ?? ""]))),
    );
  });

  test("reports skipped rows and unique handles like the Python summary", () => {
    expect(result.skipped).toBe(4);
    expect(result.uniqueHandles).toBe(12);
  });

  test("new shop candidates default to 店舗垢候補", () => {
    const fresh = buildQueue(casts, new Map(), new Map());
    expect(fresh.shop[0]?.status).toBe("店舗垢候補");
    expect(fresh.personal.every((r) => r.status === "未")).toBe(true);
  });
});

describe("statusMapFromRows", () => {
  test("lowercases handles, defaults status to 未 and skips blank handles", () => {
    const map = statusMapFromRows([
      { handle: " Foo ", 状態: "", 実施日: "" },
      { handle: "", 状態: "済", 実施日: "2026-01-01" },
      { handle: "bar", 状態: "済", 実施日: "2026-01-01" },
    ]);
    expect(map.get("foo")).toEqual({ status: "未", doneDate: "" });
    expect(map.get("bar")).toEqual({ status: "済", doneDate: "2026-01-01" });
    expect(map.size).toBe(2);
  });
});
