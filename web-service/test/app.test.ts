import { describe, expect, test } from "vitest";
import { createApp } from "../src/app";
import { createTestService, fixture } from "./support";

const HOST = "127.0.0.1:8787";
const ORIGIN = `http://${HOST}`;
const EXTENSION_ORIGIN = "chrome-extension://liiicjpegnmagfdlnmbnebdfkdkjjlpl";

function setup() {
  const ctx = createTestService();
  const app = createApp({ service: ctx.service, allowedHosts: [HOST], extensionOrigins: [EXTENSION_ORIGIN] });
  const request = (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (!headers.has("host")) headers.set("host", HOST);
    const method = (init.method ?? "GET").toUpperCase();
    if (method !== "GET" && !headers.has("origin")) headers.set("origin", ORIGIN);
    return app.request(`http://${HOST}${path}`, { ...init, headers });
  };
  const upload = (path: string, csv: string, extra: Record<string, string> = {}) => {
    const form = new FormData();
    form.set("file", new File([csv], "upload.csv", { type: "text/csv" }));
    for (const [k, v] of Object.entries(extra)) form.set(k, v);
    return request(path, { method: "POST", body: form });
  };
  const json = (path: string, method: string, body: unknown) =>
    request(path, { method, body: JSON.stringify(body), headers: { "content-type": "application/json" } });
  return { ...ctx, app, request, upload, json };
}

async function seeded() {
  const ctx = setup();
  await ctx.upload("/api/import/casts", fixture("casts.csv"));
  return ctx;
}

describe("local-only guards", () => {
  test("rejects requests for an unexpected Host (DNS rebinding)", async () => {
    const { request } = setup();
    const res = await request("/api/today", { headers: { host: "evil.example:8787" } });
    expect(res.status).toBe(403);
  });

  test("rejects state-changing requests from another origin", async () => {
    const { request } = setup();
    const res = await request("/api/today/next", { method: "POST", headers: { origin: "https://evil.example" } });
    expect(res.status).toBe(403);
  });

  test("rejects state-changing requests without Origin or Sec-Fetch-Site", async () => {
    const { app } = setup();
    const res = await app.request(`http://${HOST}/api/today/next`, { method: "POST", headers: { host: HOST } });
    expect(res.status).toBe(403);
  });

  test("accepts result reports from the follow-helper extension", async () => {
    const { request, upload } = setup();
    await upload("/api/import/casts", fixture("casts.csv"));
    await request("/api/today/next", { method: "POST" });
    const res = await request("/api/targets/frank/status", {
      method: "PUT",
      body: JSON.stringify({ status: "済" }),
      headers: { origin: EXTENSION_ORIGIN, "content-type": "application/json" },
    });
    expect(res.status).toBe(200);
  });

  test("rejects other extensions", async () => {
    const { request } = setup();
    const res = await request("/api/today/next", {
      method: "POST",
      headers: { origin: "chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
    });
    expect(res.status).toBe(403);
  });

  test("accepts same-origin fetches identified by Sec-Fetch-Site", async () => {
    const { app } = setup();
    const res = await app.request(`http://${HOST}/api/today/release`, {
      method: "POST",
      headers: { host: HOST, "sec-fetch-site": "same-origin" },
    });
    expect(res.status).toBe(200);
  });
});

describe("import API", () => {
  test("imports casts and reports a summary", async () => {
    const { upload } = setup();
    const res = await upload("/api/import/casts", fixture("casts.csv"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      data: { skipped: 4, uniqueHandles: 12, personal: 11, shop: 1, pending: 11 },
    });
  });

  test("imports an existing queue for the requested kind", async () => {
    const { upload } = setup();
    const res = await upload("/api/import/queue", fixture("existing_shop.csv"), { kind: "shop" });
    expect(await res.json()).toEqual({ ok: true, data: { imported: 1, released: 0 } });
  });

  test("rejects an unknown kind", async () => {
    const { upload } = setup();
    const res = await upload("/api/import/queue", fixture("existing_shop.csv"), { kind: "nope" });
    expect(res.status).toBe(400);
  });

  test("imports legacy result CSVs", async () => {
    const { upload } = await seeded();
    const res = await upload("/api/import/results", "handle,状態,実施日\nfrank,済,2026-09-01\n");
    expect(await res.json()).toEqual({ ok: true, data: { updated: 1, unknown: [], ignored: 0 } });
  });

  test("returns 400 with a message for malformed CSV", async () => {
    const { upload } = setup();
    const res = await upload("/api/import/casts", "a,b\n1,2\n");
    expect(res.status).toBe(400);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toContain("X(Twitter)");
  });

  test("returns 400 when the file field is missing", async () => {
    const { request } = setup();
    const res = await request("/api/import/casts", { method: "POST", body: new FormData() });
    expect(res.status).toBe(400);
  });
});

describe("today API", () => {
  test("assigns, marks and reports quota", async () => {
    const { request, json } = await seeded();
    const next = await request("/api/today/next", { method: "POST" });
    const nextBody = (await next.json()) as { data: { items: Array<{ handle: string }> } };
    expect(nextBody.data.items).toHaveLength(11);

    const marked = await json("/api/targets/frank/status", "PUT", { status: "済" });
    expect(marked.status).toBe(200);
    const markedBody = (await marked.json()) as { data: { item: { status: string }; quota: { followed1h: number } } };
    expect(markedBody.data.item.status).toBe("済");
    expect(markedBody.data.quota.followed1h).toBe(1);

    const today = (await (await request("/api/today")).json()) as { data: { items: Array<{ status: string }> } };
    expect(today.data.items.filter((i) => i.status === "当日")).toHaveLength(10);

    const quota = (await (await request("/api/quota")).json()) as { data: { remaining: number } };
    expect(quota.data.remaining).toBe(14);
  });

  test("records 既フォロー without using the follow quota", async () => {
    const { request, json } = await seeded();
    await request("/api/today/next", { method: "POST" });
    const marked = await json("/api/targets/frank/status", "PUT", { status: "既フォロー" });
    expect(marked.status).toBe(200);
    const body = (await marked.json()) as { data: { item: { status: string }; quota: { followed1h: number; remaining: number } } };
    expect(body.data.item.status).toBe("既フォロー");
    expect(body.data.quota).toMatchObject({ followed1h: 0, remaining: 15 });
    const today = (await (await request("/api/today")).json()) as { data: { summary: { followed: number } } };
    expect(today.data.summary.followed).toBe(0);
  });

  test("keeps 済 when the extension later reports 既フォロー for the same person", async () => {
    const { request, json } = await seeded();
    await request("/api/today/next", { method: "POST" });
    await json("/api/targets/frank/status", "PUT", { status: "済" });
    const res = await json("/api/targets/frank/status", "PUT", { status: "既フォロー" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { item: { status: string }; quota: { followed1h: number } } };
    expect(body.data.item.status).toBe("済");
    expect(body.data.quota.followed1h).toBe(1);
  });

  test("validates mark requests", async () => {
    const { json } = await seeded();
    expect((await json("/api/targets/frank/status", "PUT", { status: "未" })).status).toBe(400);
    expect((await json("/api/targets/frank/status", "PUT", {})).status).toBe(400);
    expect((await json("/api/targets/nobody/status", "PUT", { status: "済" })).status).toBe(404);
  });

  test("releases all 当日 rows", async () => {
    const { request } = await seeded();
    await request("/api/today/next", { method: "POST" });
    const res = await request("/api/today/release", { method: "POST" });
    expect(await res.json()).toEqual({ ok: true, data: { released: 11 } });
  });
});

describe("settings API", () => {
  test("reads and updates settings", async () => {
    const { request, json } = setup();
    expect(await (await request("/api/settings")).json()).toEqual({
      ok: true,
      data: { batchSize: 15, hourlyLimit: 15, dailyLimit: 15, operationStartDate: "" },
    });
    const res = await json("/api/settings", "PUT", { dailyLimit: 25 });
    expect(await res.json()).toEqual({ ok: true, data: { batchSize: 15, hourlyLimit: 15, dailyLimit: 25, operationStartDate: "" } });
    expect((await json("/api/settings", "PUT", { dailyLimit: "many" })).status).toBe(400);
    expect((await json("/api/settings", "PUT", { dailyLimit: 0 })).status).toBe(400);
  });
});

describe("export API", () => {
  test("downloads the queue as CSV", async () => {
    const { request } = await seeded();
    const res = await request("/api/export/queue.csv?kind=shop");
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain("x_follow_shop_candidates.csv");
    expect(await res.text()).toContain("shopacct");
  });

  test("downloads results, optionally filtered by date", async () => {
    const { request, json } = await seeded();
    await json("/api/targets/frank/status", "PUT", { status: "済" });
    const res = await request("/api/export/results.csv?date=2026-09-28");
    expect(res.headers.get("content-disposition")).toContain("follow_results_20260928.csv");
    expect(await res.text()).toContain("frank,済,2026-09-28");
  });

  test("rejects a malformed date filter", async () => {
    const { request } = await seeded();
    expect((await request("/api/export/results.csv?date=yesterday")).status).toBe(400);
  });
});

describe("open redirect with quota", () => {
  test("redirects known handles to x.com while quota remains", async () => {
    const { request } = await seeded();
    const res = await request("/go/frank");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://x.com/frank");
  });

  test("blocks opening once the limit is reached", async () => {
    const { request, json } = await seeded();
    await json("/api/settings", "PUT", { hourlyLimit: 1 });
    await json("/api/targets/frank/status", "PUT", { status: "済" });
    const res = await request("/go/gina");
    expect(res.status).toBe(429);
    expect(await res.text()).toContain("上限");
  });

  test("resetting the limit reopens profiles", async () => {
    const { request, json } = await seeded();
    await json("/api/settings", "PUT", { hourlyLimit: 1 });
    await json("/api/targets/frank/status", "PUT", { status: "済" });
    expect((await request("/go/gina")).status).toBe(429);

    const res = await request("/api/quota/reset", { method: "POST" });
    const body = (await res.json()) as { ok: boolean; data: { blocked: boolean } };
    expect(body).toMatchObject({ ok: true, data: { blocked: false } });
    expect((await request("/go/gina")).status).toBe(302);
  });

  test("quota reset requires a same-origin request", async () => {
    const { request } = await seeded();
    const res = await request("/api/quota/reset", { method: "POST", headers: { origin: "https://evil.example" } });
    expect(res.status).toBe(403);
  });

  test("returns 404 for handles outside the queue", async () => {
    const { request } = await seeded();
    expect((await request("/go/nobody")).status).toBe(404);
  });
});

describe("shops", () => {
  async function withShops() {
    const ctx = await seeded();
    await ctx.upload("/api/import/shops", fixture("shops.csv"));
    return ctx;
  }

  test("imports the shop list", async () => {
    const { upload } = setup();
    const res = await upload("/api/import/shops", fixture("shops.csv"));
    expect(await res.json()).toEqual({ ok: true, data: { imported: 4, skipped: 1, duplicates: 1 } });
  });

  test("lists shops with safe links and a link to the shop's people", async () => {
    const { request } = await withShops();
    const html = await (await request("/list?tab=shops")).text();
    expect(html).toContain("ShopA");
    expect(html).toContain('href="https://a.example"');
    expect(html).not.toContain("javascript:alert(1)");
    expect(html).toContain("/list?tab=personal&amp;pref=tokyo&amp;shop=ShopF");
  });

  test("filters shops by prefecture and keyword", async () => {
    const { request } = await withShops();
    const osaka = await (await request("/list?tab=shops&pref=osaka")).text();
    expect(osaka).toContain("ShopB");
    expect(osaka).not.toContain("ShopA");
    const kana = await (await request(`/list?tab=shops&q=${encodeURIComponent("ショップ")}`)).text();
    expect(kana).toContain("ShopA");
    expect(kana).not.toContain("ShopB");
  });

  test("the people list can be narrowed to one shop", async () => {
    const { request } = await withShops();
    const html = await (await request("/list?tab=personal&pref=tokyo&shop=ShopF")).text();
    expect(html).toContain("@frank");
    expect(html).not.toContain("@alice_1");
    expect(html).toContain("店舗「ShopF」の人だけを表示しています");
    // 検索フォームを送り直しても店舗の絞り込みが外れない
    expect(html).toContain('<input type="hidden" name="shop" value="ShopF"/>');
  });

  test("tells how to import when there is no shop list yet", async () => {
    const { request } = await seeded();
    const html = await (await request("/list?tab=shops")).text();
    expect(html).toContain("店舗一覧はまだありません");
  });
});

describe("pages", () => {
  test.each(["/", "/list", "/list?tab=shop", "/list?tab=shops", "/admin"])("%s renders HTML", async (path) => {
    const { request } = await seeded();
    const res = await request(path);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(await res.text()).toContain("自動フォロー");
  });

  test.each([
    ["/queue?kind=shop&status=未", "/list?tab=shop&status=%E6%9C%AA"],
    ["/queue?pref=tokyo&shop=ShopF", "/list?tab=personal&pref=tokyo&shop=ShopF"],
    ["/shops?pref=osaka&q=x", "/list?tab=shops&pref=osaka&q=x"],
    ["/import", "/admin#data"],
    ["/settings", "/admin#settings"],
  ])("redirects the old URL %s", async (from, to) => {
    const { request } = setup();
    const res = await request(from);
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe(to);
  });

  test("list shows Japanese labels and searches by keyword", async () => {
    const { request } = await seeded();
    const html = await (await request(`/list?q=${encodeURIComponent("ShopF")}`)).text();
    expect(html).toContain("@frank");
    expect(html).toContain("@gina");
    expect(html).not.toContain("@bob");
    expect(html).toContain("東京");
    expect(html).toContain("未着手");
  });

  test("list escapes scraped text and paginates", async () => {
    const { request } = await seeded();
    const html = await (await request("/list?status=未&page=1&size=2")).text();
    expect(html).toContain("frank");
    expect(html).not.toContain("<b>た</b>");
    const page2 = await (await request("/list?status=未&page=2&size=2")).text();
    expect(page2).toContain("&lt;b&gt;た&lt;/b&gt;");
  });

  test("admin shows the automatic warm-up start date", async () => {
    const { request, service } = await seeded();
    service.assignNext();
    service.mark("frank", "済");
    const html = await (await request("/admin")).text();
    expect(html).toContain('name="operationStartDate"');
    expect(html).toContain("最初にフォローした日（2026-09-28）");
  });

  test("serves static assets and 404s unknown ones", async () => {
    const { request } = setup();
    const js = await request("/static/today.js");
    expect(js.headers.get("content-type")).toContain("javascript");
    expect((await request("/static/../../package.json")).status).toBe(404);
    expect((await request("/static/nope.js")).status).toBe(404);
  });

  test("serves the logo images as PNG and links them from every page", async () => {
    const { request } = setup();
    for (const name of ["logo-mark.png", "favicon-32.png", "favicon-16.png", "apple-touch-icon.png"]) {
      const res = await request(`/static/${name}`);
      expect(res.headers.get("content-type")).toBe("image/png");
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect([...bytes.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    }
    const html = await (await request("/")).text();
    expect(html).toContain('rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32.png"');
    expect(html).toContain('rel="apple-touch-icon" href="/static/apple-touch-icon.png"');
    expect(html).toContain('class="brand-mark" src="/static/logo-mark.png"');
  });
});
