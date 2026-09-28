import { Hono, type Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import { prefectureLabel } from "../domain/prefectures";
import type { QueueService } from "../services/queueService";
import { AdminPage } from "../views/AdminPage";
import { ListPage } from "../views/ListPage";
import { listHref, type ListTab } from "../views/links";
import { MessagePage } from "../views/MessagePage";
import { TodayPage } from "../views/TodayPage";
import { STATIC_ASSETS } from "./static";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;

const optionalText = z
  .string()
  .max(200)
  .optional()
  .catch(undefined)
  .transform((v) => v?.trim() || undefined);

const listQuerySchema = z.object({
  tab: z.enum(["personal", "shop", "shops"]).catch("personal"),
  status: optionalText,
  pref: optionalText,
  shop: optionalText,
  q: optionalText,
  page: z.coerce.number().int().min(1).catch(1),
  size: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).catch(DEFAULT_PAGE_SIZE),
});

function render(c: Context, node: unknown, status: ContentfulStatusCode = 200) {
  return c.html(`<!DOCTYPE html>${String(node)}`, status);
}

function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

const sum = (counts: Record<string, number>) => Object.values(counts).reduce((total, n) => total + n, 0);

function renderList(c: Context, service: QueueService) {
  const q = listQuerySchema.parse(c.req.query());
  const size = q.size === DEFAULT_PAGE_SIZE ? undefined : q.size;
  const counts = service.counts();
  const shopPrefectures = service.shopPrefectures();
  const tabCounts: Record<ListTab, number> = {
    personal: sum(counts.personal),
    shop: sum(counts.shop),
    shops: shopPrefectures.reduce((total, p) => total + p.count, 0),
  };

  if (q.tab === "shops") {
    const query = { tab: q.tab, prefecture: q.pref, q: q.q, size };
    const result = service.listShops({ prefecture: q.pref, q: q.q, page: q.page, pageSize: q.size });
    const prefectures = shopPrefectures.map((p) => ({ ...p, label: prefectureLabel(p.prefecture) }));
    return render(c, <ListPage view="shops" tabCounts={tabCounts} prefectures={prefectures} list={{ query, ...result }} />);
  }

  const kind = q.tab;
  const query = { tab: kind, status: q.status, prefecture: q.pref, shop: q.shop, q: q.q, size };
  const result = service.list({ kind, status: q.status, prefecture: q.pref, shop: q.shop, q: q.q, page: q.page, pageSize: q.size });
  return render(
    c,
    <ListPage
      view="targets"
      tabCounts={tabCounts}
      prefectures={service.targetPrefectures(kind)}
      list={{ query, statusCounts: counts[kind], ...result }}
    />,
  );
}

/** 旧URL（/queue, /shops, /import, /settings）から新しい画面へ。ブックマークを壊さない。 */
function legacyRedirects(pages: Hono) {
  pages.get("/queue", (c) => {
    const q = c.req.query();
    const tab: ListTab = q.kind === "shop" ? "shop" : "personal";
    return c.redirect(listHref({ tab, status: q.status, prefecture: q.pref, shop: q.shop }), 301);
  });
  pages.get("/shops", (c) => {
    const q = c.req.query();
    return c.redirect(listHref({ tab: "shops", prefecture: q.pref, q: q.q }), 301);
  });
  pages.get("/import", (c) => c.redirect("/admin#data", 301));
  pages.get("/settings", (c) => c.redirect("/admin#settings", 301));
}

export function pageRoutes(service: QueueService): Hono {
  const pages = new Hono();

  pages.get("/", (c) => render(c, <TodayPage />));
  pages.get("/list", (c) => renderList(c, service));
  pages.get("/admin", (c) =>
    render(c, <AdminPage settings={service.settings()} firstFollowDate={service.summary().firstFollowDate} />),
  );
  legacyRedirects(pages);

  /** プロフィールを開く入口。上限に達していたら x.com へは飛ばさない。 */
  pages.get("/go/:handle", (c) => {
    const result = service.canOpen(c.req.param("handle").trim().toLowerCase());
    if (result.ok) return c.redirect(result.url, 302);
    if (result.reason === "unknown") {
      return render(c, <MessagePage title="見つかりません" message="このhandleは名簿にありません。" />, 404);
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
