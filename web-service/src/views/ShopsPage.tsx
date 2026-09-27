import type { ShopWithQueue } from "../db/shopRepository";
import { Layout } from "./Layout";
import { queueHref, safeHttpUrl } from "./links";

export interface ShopsPageProps {
  prefecture?: string;
  q?: string;
  prefectures: ReadonlyArray<{ prefecture: string; count: number }>;
  items: readonly ShopWithQueue[];
  total: number;
  page: number;
  pageSize: number;
}

function shopsHref(prefecture: string | undefined, q: string | undefined, page: number, size: number): string {
  const query = new URLSearchParams();
  if (prefecture) query.set("pref", prefecture);
  if (q) query.set("q", q);
  query.set("page", String(page));
  query.set("size", String(size));
  return `/shops?${query.toString()}`;
}

function ExternalLink({ href, label }: { href: string | undefined; label: string }) {
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  ) : null;
}

function ShopRow({ shop }: { shop: ShopWithQueue }) {
  return (
    <tr>
      <td>
        {shop.prefecture}
        <div class="meta">{shop.area}</div>
      </td>
      <td>
        <strong>{shop.name}</strong>
        {shop.kana ? <div class="meta">{shop.kana}</div> : null}
        <div class="meta">{shop.category}</div>
      </td>
      <td>
        {shop.address}
        {shop.phone ? <div class="meta">{shop.phone}</div> : null}
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
          <a href={queueHref({ kind: "personal", prefecture: shop.prefecture, shop: shop.name })}>
            {shop.queueTotal}件（未{shop.queuePending}・済{shop.queueDone}）
          </a>
        ) : (
          <span class="meta">0</span>
        )}
      </td>
    </tr>
  );
}

export function ShopsPage({ prefecture, q, prefectures, items, total, page, pageSize }: ShopsPageProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  return (
    <Layout title="店舗一覧" active="shops">
      <h1>店舗一覧</h1>
      {prefectures.length === 0 ? (
        <p class="meta">
          店舗一覧はまだありません。<a href="/import">取込・出力</a> で pokepara_all_shops.csv を取り込んでください。
        </p>
      ) : null}
      <form class="search" method="get" action="/shops">
        <select name="pref">
          <option value="">すべての都道府県</option>
          {prefectures.map((p) => (
            <option value={p.prefecture} selected={p.prefecture === prefecture}>
              {p.prefecture}（{p.count}）
            </option>
          ))}
        </select>
        <input type="search" name="q" value={q ?? ""} placeholder="店舗名・カナ・エリア・住所" />
        <input type="hidden" name="size" value={String(pageSize)} />
        <button type="submit">絞り込む</button>
      </form>
      <p class="meta">
        {total} 店舗中 {total ? (page - 1) * pageSize + 1 : 0}〜{Math.min(page * pageSize, total)} 件。
        キュー件数は個人キューのうち同じ都道府県・店舗名の件数。
      </p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>都道府県 / エリア</th>
              <th>店舗</th>
              <th>住所 / 電話</th>
              <th>リンク</th>
              <th>キュー</th>
            </tr>
          </thead>
          <tbody>
            {items.map((shop) => (
              <ShopRow shop={shop} />
            ))}
          </tbody>
        </table>
      </div>
      <nav class="pager">
        {page > 1 ? <a href={shopsHref(prefecture, q, page - 1, pageSize)}>← 前へ</a> : <span />}
        <span class="meta">
          {page} / {lastPage}
        </span>
        {page < lastPage ? <a href={shopsHref(prefecture, q, page + 1, pageSize)}>次へ →</a> : <span />}
      </nav>
    </Layout>
  );
}
