import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createApp } from "../src/app";
import { CsvFormatError, parseCsv, requireColumns } from "../src/csv/parse";
import { openDatabase } from "../src/db/database";
import { queueItemFromCsv } from "../src/domain/queueRows";
import type { QueueService } from "../src/services/queueService";
import { createQueueService } from "../src/services/queueService";

const HOST = "127.0.0.1:8787";

describe("csv parsing", () => {
  test("wraps parser errors in CsvFormatError", () => {
    expect(() => parseCsv('a,b\n"unterminated,1\n')).toThrow(CsvFormatError);
  });

  test("accepts mixed CRLF / LF / CR line endings like Python's csv module", () => {
    const rows = parseCsv('﻿a,b\r\n1,2\n3,4\r5,"x\r\ny"\r\n');
    expect(rows).toEqual([
      { a: "1", b: "2" },
      { a: "3", b: "4" },
      { a: "5", b: "x\r\ny" },
    ]);
  });

  test("checks the header even when there are no data rows", () => {
    expect(() => requireColumns([], "﻿handle,状態\r\n", ["handle", "状態"])).not.toThrow();
    expect(() => requireColumns([], "handle\n", ["handle", "状態"])).toThrow("状態");
  });
});

describe("queueItemFromCsv", () => {
  test("falls back to row order and defaults for missing values", () => {
    expect(queueItemFromCsv({ handle: " Foo ", 優先度: "x", 出現回数: "" }, 4, "shop")).toMatchObject({
      handle: "foo",
      priority: 5,
      occurrences: 1,
      status: "店舗垢候補",
    });
    expect(queueItemFromCsv({ handle: "" }, 0, "personal")).toBeNull();
  });
});

describe("database file", () => {
  let dir = "";
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  test("persists data across reopen without re-running the migration", () => {
    dir = mkdtempSync(join(tmpdir(), "follow-queue-"));
    const path = join(dir, "nested", "app.db");
    const first = openDatabase(path);
    createQueueService(first).updateSettings({ dailyLimit: 20 });
    first.close();
    const second = openDatabase(path);
    expect(createQueueService(second).settings().dailyLimit).toBe(20);
    second.close();
  });
});

describe("error handling", () => {
  test("returns a generic 500 and logs unexpected errors", async () => {
    const failing = {
      today: () => {
        throw new Error("boom");
      },
    } as unknown as QueueService;
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createApp({ service: failing, allowedHosts: [HOST] });
    const res = await app.request(`http://${HOST}/api/today`, { headers: { host: HOST } });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).not.toContain("boom");
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });

  test("rejects invalid JSON bodies with 400", async () => {
    const service = createQueueService(openDatabase(":memory:"));
    const app = createApp({ service, allowedHosts: [HOST] });
    const res = await app.request(`http://${HOST}/api/settings`, {
      method: "PUT",
      body: "{not json",
      headers: { host: HOST, origin: `http://${HOST}`, "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  test("rejects oversized JSON bodies with 413", async () => {
    const service = createQueueService(openDatabase(":memory:"));
    const app = createApp({ service, allowedHosts: [HOST] });
    const res = await app.request(`http://${HOST}/api/settings`, {
      method: "PUT",
      body: JSON.stringify({ pad: "x".repeat(100 * 1024) }),
      headers: { host: HOST, origin: `http://${HOST}`, "content-type": "application/json" },
    });
    expect(res.status).toBe(413);
  });

  test("rejects uploads over the size limit with 413", async () => {
    const service = createQueueService(openDatabase(":memory:"));
    const app = createApp({ service, allowedHosts: [HOST] });
    const res = await app.request(`http://${HOST}/api/import/casts`, {
      method: "POST",
      body: "x",
      headers: {
        host: HOST,
        origin: `http://${HOST}`,
        "content-type": "multipart/form-data; boundary=x",
        "content-length": String(200 * 1024 * 1024),
      },
    });
    expect(res.status).toBe(413);
  });
});
