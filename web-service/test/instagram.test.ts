import { describe, expect, test } from "vitest";
import { createApp } from "../src/app";
import { openDatabase } from "../src/db/database";
import { instagramProfileUrl, normalizeInstagramHandle } from "../src/domain/handle";
import { PLATFORMS } from "../src/domain/platform";
import { warmupGuide } from "../src/domain/warmup";
import { createQueueService } from "../src/services/queueService";
import { fakeClock, fixture } from "./support";

const HOST = "127.0.0.1:8787";
const ORIGIN = `http://${HOST}`;
const EXTENSION_ORIGIN = "chrome-extension://liiicjpegnmagfdlnmbnebdfkdkjjlpl";

function services() {
  const db = openDatabase(":memory:");
  const clock = fakeClock(new Date(2026, 8, 28, 10, 0, 0));
  const x = createQueueService(db, clock.now);
  const ig = createQueueService(db, clock.now, "instagram");
  return { db, clock, x, ig };
}

function setup() {
  const ctx = services();
  const app = createApp({
    service: ctx.x,
    instagramService: ctx.ig,
    allowedHosts: [HOST],
    extensionOrigins: [EXTENSION_ORIGIN],
  });
  const request = (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (!headers.has("host")) headers.set("host", HOST);
    const method = (init.method ?? "GET").toUpperCase();
    if (method !== "GET" && !headers.has("origin")) headers.set("origin", ORIGIN);
    return app.request(`http://${HOST}${path}`, { ...init, headers });
  };
  const upload = (path: string, csv: string) => {
    const form = new FormData();
    form.set("file", new File([csv], "upload.csv", { type: "text/csv" }));
    return request(path, { method: "POST", body: form });
  };
  const json = (path: string, method: string, body: unknown) =>
    request(path, { method, body: JSON.stringify(body), headers: { "content-type": "application/json" } });
  return { ...ctx, request, upload, json };
}

describe("normalizeInstagramHandle", () => {
  test.each([
    ["https://www.instagram.com/Ai.Chan_1/", "ai.chan_1"],
    ["https://instagram.com/ai.chan_1?igsh=abc", "ai.chan_1"],
    ["https://www.instagram.com/boo__b/reels/", "boo__b"],
    ["https://www.instagram.com/%20dee.x", "dee.x"],
    ["https://www.instagram.com/@_under_", "_under_"],
  ])("extracts handle from %s", (url, expected) => {
    expect(normalizeInstagramHandle(url)).toBe(expected);
  });

  test.each([
    [undefined],
    [""],
    ["https://www.instagram.com/p/Cabc123/"],
    ["https://www.instagram.com/invites/contact/?i=1"],
    ["https://www.instagram.com/stories/someone/123/"],
    ["https://instagram.com/_u/someone"],
    ["https://www.pokepara.jp/tokyo/shop/1/"],
    ["https://x.com/alice_1"],
    ["https://www.instagram.com/this_name_is_far_too_long_for_instagram"],
    ["https://www.instagram.com/%E3%81%AA%E3%81%97"],
  ])("returns null for %s", (url) => {
    expect(normalizeInstagramHandle(url)).toBeNull();
  });

  test("builds the profile URL", () => {
    expect(instagramProfileUrl("ai.chan_1")).toBe("https://www.instagram.com/ai.chan_1/");
  });
});

describe("Instagram warm-up", () => {
  test("uses the gentler Instagram stages", () => {
    const stages = PLATFORMS.instagram.warmupStages;
    expect(warmupGuide("2026-09-01", "2026-09-01", stages)).toEqual({ week: 1, min: 10, max: 20 });
    expect(warmupGuide("2026-09-01", "2026-09-08", stages)).toEqual({ week: 2, min: 20, max: 40 });
    expect(warmupGuide("2026-09-01", "2026-10-28", stages)).toEqual({ week: 9, min: 40, max: 60 });
    expect(PLATFORMS.instagram.warmupHint).toBe("目安: 1週目10〜20／2週目20〜40／3週目以降40〜60。");
  });
});

describe("platform separation in the queue service", () => {
  test("imports the Instagram column into the Instagram list only", () => {
    const { x, ig } = services();
    const result = ig.importCasts(fixture("casts_instagram.csv"));
    expect(result).toMatchObject({ personal: 4, shop: 0, skipped: 3, uniqueHandles: 4 });
    expect(
      ig
        .list({ kind: "personal", page: 1, pageSize: 50 })
        .items.map((t) => t.handle)
        .sort(),
    ).toEqual(["ai.chan_1", "alice_1", "boo__b", "dee.x"]);
    expect(x.counts()).toEqual({ personal: {}, shop: {} });
  });

  test("the same handle can live in both lists with separate progress", () => {
    const { x, ig } = services();
    x.importCasts(fixture("casts.csv"));
    ig.importCasts(fixture("casts_instagram.csv"));
    x.mark("frank", "済");
    ig.mark("alice_1", "死垢");
    expect(x.list({ kind: "personal", q: "frank", page: 1, pageSize: 5 }).items[0]?.status).toBe("済");
    expect(ig.list({ kind: "personal", q: "alice_1", page: 1, pageSize: 5 }).items[0]?.status).toBe("死垢");
    // X を取り込み直しても Instagram の名簿と進み具合は変わらない
    x.importCasts(fixture("casts.csv"));
    expect(ig.counts().personal).toEqual({ 未: 3, 死垢: 1 });
    ig.importCasts(fixture("casts_instagram.csv"));
    expect(ig.counts().personal).toEqual({ 未: 3, 死垢: 1 });
    expect(x.list({ kind: "personal", q: "frank", page: 1, pageSize: 5 }).items[0]?.status).toBe("済");
  });

  test("settings, quota and summary are independent", () => {
    const { x, ig } = services();
    expect(ig.settings()).toEqual({ batchSize: 10, hourlyLimit: 10, dailyLimit: 20, operationStartDate: "" });
    expect(x.settings().dailyLimit).toBe(15);
    ig.updateSettings({ dailyLimit: 30 });
    expect(x.settings().dailyLimit).toBe(15);
    expect(ig.settings().dailyLimit).toBe(30);

    ig.importCasts(fixture("casts_instagram.csv"));
    ig.assignNext();
    ig.mark("dee.x", "済");
    expect(ig.quota().followed1h).toBe(1);
    expect(x.quota().followed1h).toBe(0);
    expect(ig.summary()).toMatchObject({ followed: 1, followCap: 7500 });
    expect(x.summary().followCap).toBe(5000);

    ig.resetQuota();
    expect(ig.quota().followed1h).toBe(0);
    expect(ig.exportResults()).toContain("dee.x");
    expect(x.exportResults()).not.toContain("dee.x");
  });

  test("opens instagram.com profiles", () => {
    const { ig } = services();
    ig.importCasts(fixture("casts_instagram.csv"));
    expect(ig.canOpen("dee.x")).toMatchObject({ ok: true, url: "https://www.instagram.com/dee.x/" });
  });

  test("rejects a cast CSV without the Instagram column", () => {
    const { ig } = services();
    expect(() => ig.importCasts("都道府県,X(Twitter)\ntokyo,https://x.com/a\n")).toThrow("Instagram");
  });
});

describe("Instagram pages and API", () => {
  test("the top tabs switch between X and Instagram", async () => {
    const { request } = setup();
    const x = await (await request("/")).text();
    expect(x).toContain("Xフォロー優先キュー");
    expect(x).toMatch(/href="\/" class="platform-tab platform-x" aria-current="page"/);
    expect(x).toMatch(/href="\/ig" class="platform-tab platform-instagram"/);

    const res = await request("/ig");
    expect(res.status).toBe(200);
    const ig = await res.text();
    expect(ig).toContain("Instagramフォロー優先キュー");
    expect(ig).toMatch(/href="\/ig" class="platform-tab platform-instagram" aria-current="page"/);
    expect(ig).toContain('href="/ig/list"');
    expect(ig).toContain('data-api-base="/api/ig"');
    expect(ig).toContain("Instagramで開く");
  });

  test.each(["/ig/list", "/ig/list?tab=shop", "/ig/list?tab=shops", "/ig/admin"])("%s renders", async (path) => {
    const { request } = setup();
    const res = await request(path);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Instagramフォロー優先キュー");
  });

  test("admin posts to the Instagram API and explains the Instagram column", async () => {
    const { request } = setup();
    const html = await (await request("/ig/admin")).text();
    expect(html).toContain('data-api="/api/ig/import/casts"');
    expect(html).toContain('data-api="/api/ig/settings"');
    expect(html).toContain("Instagram 列から Instagram の名簿を作ります");
    expect(html).toContain("instagram_follow_queue.csv");
  });

  test("imports, assigns, records extension results and opens profiles", async () => {
    const { request, upload, json } = setup();
    const imported = await upload("/api/ig/import/casts", fixture("casts_instagram.csv"));
    expect(imported.status).toBe(200);

    const next = (await (await request("/api/ig/today/next", { method: "POST" })).json()) as {
      data: { items: Array<{ handle: string }> };
    };
    expect(next.data.items.map((i) => i.handle)).toContain("dee.x");

    const fromExtension = await request("/api/ig/targets/dee.x/status", {
      method: "PUT",
      body: JSON.stringify({ status: "既フォロー" }),
      headers: { "content-type": "application/json", origin: EXTENSION_ORIGIN },
    });
    expect(fromExtension.status).toBe(200);

    // X 側には同じ handle がないので 404
    expect((await json("/api/targets/dee.x/status", "PUT", { status: "済" })).status).toBe(404);

    const go = await request("/ig/go/boo__b");
    expect(go.status).toBe(302);
    expect(go.headers.get("location")).toBe("https://www.instagram.com/boo__b/");
    expect((await request("/go/boo__b")).status).toBe(404);

    const list = await (await request("/ig/list?q=dee")).text();
    expect(list).toContain("@dee.x");
    expect(list).toContain('action="/ig/list"');
  });

  test("exports with Instagram file names", async () => {
    const { request, upload } = setup();
    await upload("/api/ig/import/casts", fixture("casts_instagram.csv"));
    const queue = await request("/api/ig/export/queue.csv?kind=personal");
    expect(queue.headers.get("content-disposition")).toContain("instagram_follow_queue.csv");
    const results = await request("/api/ig/export/results.csv?date=2026-09-28");
    expect(results.headers.get("content-disposition")).toContain("instagram_follow_results_20260928.csv");
  });

  test("legacy redirects stay inside the Instagram pages", async () => {
    const { request } = setup();
    const res = await request("/ig/queue?kind=shop");
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("/ig/list?tab=shop");
  });
});
