import { Hono, type Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import type { TargetKind } from "../domain/constants";
import type { QueueService } from "../services/queueService";
import { ImportPage } from "../views/ImportPage";
import { MessagePage } from "../views/MessagePage";
import { QueuePage } from "../views/QueuePage";
import { SettingsPage } from "../views/SettingsPage";
import { ShopsPage } from "../views/ShopsPage";
import { TodayPage } from "../views/TodayPage";
import { STATIC_ASSETS } from "./static";

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

const optionalText = z
  .string()
  .max(200)
  .optional()
  .catch(undefined)
  .transform((v) => v?.trim() || undefined);
const pagingSchema = {
  page: z.coerce.number().int().min(1).catch(1),
  size: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).catch(DEFAULT_PAGE_SIZE),
};

const queueQuerySchema = z.object({
  kind: z.enum(["personal", "shop"]).catch("personal"),
  status: optionalText,
  pref: optionalText,
  shop: optionalText,
  ...pagingSchema,
});

const shopsQuerySchema = z.object({ pref: optionalText, q: optionalText, ...pagingSchema });

function render(c: Context, node: unknown, status: ContentfulStatusCode = 200) {
  return c.html(`<!DOCTYPE html>${String(node)}`, status);
}

function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export function pageRoutes(service: QueueService): Hono {
  const pages = new Hono();

  pages.get("/", (c) => render(c, <TodayPage />));

  pages.get("/queue", (c) => {
    const q = queueQuerySchema.parse(c.req.query());
    const kind: TargetKind = q.kind;
    const filter = { kind, status: q.status, prefecture: q.pref, shop: q.shop };
    const result = service.list({ ...filter, page: q.page, pageSize: q.size });
    return render(c, <QueuePage {...filter} counts={service.counts()} {...result} />);
  });

  pages.get("/shops", (c) => {
    const q = shopsQuerySchema.parse(c.req.query());
    const result = service.listShops({ prefecture: q.pref, q: q.q, page: q.page, pageSize: q.size });
    return render(
      c,
      <ShopsPage prefecture={q.pref} q={q.q} prefectures={service.shopPrefectures()} {...result} />,
    );
  });

  pages.get("/import", (c) => render(c, <ImportPage />));
  pages.get("/settings", (c) => render(c, <SettingsPage settings={service.settings()} />));

  /** プロフィールを開く入口。上限に達していたら x.com へは飛ばさない。 */
  pages.get("/go/:handle", (c) => {
    const result = service.canOpen(c.req.param("handle").trim().toLowerCase());
    if (result.ok) return c.redirect(result.url, 302);
    if (result.reason === "unknown") {
      return render(c, <MessagePage title="見つかりません" message="このhandleはキューにありません。" />, 404);
    }
    const retry = result.quota.retryAt ? `${formatTime(result.quota.retryAt)} 以降に再開できます。` : "";
    return render(
      c,
      <MessagePage
        title="フォロー上限に達しました"
        message={`直近1時間 ${result.quota.followed1h} 件 / 24時間 ${result.quota.followed24h} 件。上限に達したので新しいプロフィールは開きません。${retry}`}
      />,
      429,
    );
  });

  pages.get("/static/:name", (c) => {
    const asset = STATIC_ASSETS.get(c.req.param("name"));
    if (!asset) return c.text("見つかりません", 404);
    return c.body(asset.body, 200, { "content-type": asset.type, "cache-control": "no-cache" });
  });

  return pages;
}
