import type { ShopWithQueue } from "../../db/shopRepository";
import { prefectureLabel } from "../../domain/prefectures";
import { listHref, safeHttpUrl, type ListQuery } from "../links";
import { PageSummary, Pager } from "../Pager";

export interface ShopListProps {
  query: ListQuery & { tab: "shops" };
  items: readonly ShopWithQueue[];
  total: number;
  page: number;
  pageSize: number;
}

function ExternalLink({ href, label }: { href: string | undefined; label: string }) {
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  ) : null;
}

function ShopRow({ shop, base }: { shop: ShopWithQueue; base: string | undefined }) {
  return (
    <tr>
      <td>
        {prefectureLabel(shop.prefecture)}
        <div class="muted">{shop.area}</div>
      </td>
      <td>
        <strong>{shop.name}</strong>
        {shop.kana ? <div class="muted">{shop.kana}</div> : null}
        <div class="muted">{shop.category}</div>
      </td>
      <td>
        {shop.address}
        {shop.phone ? <div class="muted">{shop.phone}</div> : null}
      </td>
      <td class="links-cell">
        <ExternalLink href={safeHttpUrl(shop.shopUrl)} label="ポケパラ" />
        <ExternalLink href={safeHttpUrl(shop.officialUrl)} label="公式" />
        <ExternalLink href={safeHttpUrl(shop.xUrl)} label="X" />
        <ExternalLink href={safeHttpUrl(shop.instagram)} label="Instagram" />
        <ExternalLink href={safeHttpUrl(shop.tiktok)} label="TikTok" />
      </td>
      <td class="num">
        {shop.queueTotal ? (
          <a href={listHref({ base, tab: "personal", prefecture: shop.prefecture, shop: shop.name })}>
            {shop.queueTotal}人
            <div class="muted">
              未着手{shop.queuePending}・フォロー{shop.queueDone}
            </div>
          </a>
        ) : (
          <span class="muted">0</span>
        )}
      </td>
    </tr>
  );
}

export function ShopList({ query, items, total, page, pageSize }: ShopListProps) {
  return (
    <>
      <div class="table-wrap card">
        {items.length ? (
          <table>
            <thead>
              <tr>
                <th>地域</th>
                <th>店舗</th>
                <th>住所 / 電話</th>
                <th>リンク</th>
                <th class="num">名簿の人数</th>
              </tr>
            </thead>
            <tbody>
              {items.map((shop) => (
                <ShopRow shop={shop} base={query.base} />
              ))}
            </tbody>
          </table>
        ) : (
          <p class="empty">条件に合う店舗はありません。</p>
        )}
        <div class="table-foot">
          <PageSummary page={page} pageSize={pageSize} total={total} />
          <Pager page={page} pageSize={pageSize} total={total} href={(p) => listHref({ ...query, page: p })} />
        </div>
      </div>
    </>
  );
}
