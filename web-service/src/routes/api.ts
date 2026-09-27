import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import { BadRequest, fail, ok } from "../http/errors";
import { settingsSchema, type QueueService } from "../services/queueService";

const UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024;
const JSON_LIMIT_BYTES = 64 * 1024;

const kindSchema = z.enum(["personal", "shop"]);
const markSchema = z.object({ status: z.string().min(1) });
const settingsPatchSchema = settingsSchema.partial().strict();
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const EXPORT_NAMES = { personal: "x_follow_queue.csv", shop: "x_follow_shop_candidates.csv" } as const;

async function readJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new BadRequest("JSONを読めませんでした");
  }
}

async function readUpload(c: Context): Promise<{ text: string; fields: Record<string, unknown> }> {
  const fields = await c.req.parseBody();
  const file = fields["file"];
  if (!(file instanceof File)) throw new BadRequest("CSVファイルを選んでください");
  return { text: await file.text(), fields };
}

function csvResponse(c: Context, filename: string, body: string) {
  return c.body(body, 200, {
    "content-type": "text/csv; charset=utf-8",
    "content-disposition": `attachment; filename="${filename}"`,
  });
}

export function apiRoutes(service: QueueService): Hono {
  const api = new Hono();

  // JSON を受ける更新系は小さい本文だけを受け付ける（CSV取込は /import/* で別上限）
  for (const path of ["/targets/*", "/settings"]) {
    api.use(
      path,
      bodyLimit({ maxSize: JSON_LIMIT_BYTES, onError: (c) => c.json(fail("リクエストが大きすぎます"), 413) }),
    );
  }

  api.get("/today", (c) => c.json(ok(service.today())));
  api.post("/today/next", (c) => c.json(ok(service.assignNext())));
  api.post("/today/release", (c) => c.json(ok({ released: service.releaseAll() })));
  api.get("/quota", (c) => c.json(ok(service.quota())));
  api.post("/quota/reset", (c) => c.json(ok(service.resetQuota())));

  api.put("/targets/:handle/status", async (c) => {
    const body = markSchema.safeParse(await readJson(c));
    if (!body.success) throw new BadRequest("status を指定してください");
    const handle = c.req.param("handle").trim().toLowerCase();
    return c.json(ok(service.mark(handle, body.data.status)));
  });

  api.get("/settings", (c) => c.json(ok(service.settings())));
  api.put("/settings", async (c) => {
    const patch = settingsPatchSchema.safeParse(await readJson(c));
    if (!patch.success) throw new BadRequest("設定値は1以上の整数で指定してください");
    return c.json(ok(service.updateSettings(patch.data)));
  });

  api.use(
    "/import/*",
    bodyLimit({
      maxSize: UPLOAD_LIMIT_BYTES,
      onError: (c) => c.json(fail("ファイルが大きすぎます（上限100MB）"), 413),
    }),
  );
  api.post("/import/casts", async (c) => {
    const { text } = await readUpload(c);
    return c.json(ok(service.importCasts(text)));
  });
  api.post("/import/queue", async (c) => {
    const { text, fields } = await readUpload(c);
    const kind = kindSchema.safeParse(fields["kind"] ?? "personal");
    if (!kind.success) throw new BadRequest("kind は personal か shop を指定してください");
    return c.json(ok(service.importQueue(text, kind.data)));
  });
  api.post("/import/shops", async (c) => {
    const { text } = await readUpload(c);
    return c.json(ok(service.importShops(text)));
  });
  api.post("/import/results", async (c) => {
    const { text } = await readUpload(c);
    return c.json(ok(service.importResults(text)));
  });

  api.get("/export/queue.csv", (c) => {
    const kind = kindSchema.safeParse(c.req.query("kind") ?? "personal");
    if (!kind.success) throw new BadRequest("kind は personal か shop を指定してください");
    return csvResponse(c, EXPORT_NAMES[kind.data], service.exportQueue(kind.data));
  });
  api.get("/export/results.csv", (c) => {
    const raw = c.req.query("date");
    if (raw === undefined || raw === "") {
      return csvResponse(c, "follow_results_all.csv", service.exportResults());
    }
    const date = isoDateSchema.safeParse(raw);
    if (!date.success) throw new BadRequest("date は YYYY-MM-DD で指定してください");
    return csvResponse(c, `follow_results_${date.data.replaceAll("-", "")}.csv`, service.exportResults(date.data));
  });

  return api;
}
