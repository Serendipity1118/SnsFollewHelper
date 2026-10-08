import { PREF_RANK, PREF_RANK_DEFAULT, STATUS_DONE, STATUS_PENDING } from "../domain/constants";
import type { Platform } from "../domain/platform";
import type { Shop } from "../domain/shopRows";
import type { Db } from "./database";

export interface ShopWithQueue extends Shop {
  /** 個人キューでこの店舗（都道府県+店舗名）に属する件数 */
  queueTotal: number;
  queuePending: number;
  queueDone: number;
}

export interface ShopFilter {
  prefecture?: string;
  q?: string;
}

const SELECT = `SELECT s.shop_url AS shopUrl, s.prefecture, s.name, s.kana, s.area, s.category, s.address,
  s.phone, s.official_url AS officialUrl, s.email, s.instagram, s.x_url AS xUrl, s.tiktok, s.line, s.youtube,
  COALESCE(t.total, 0) AS queueTotal, COALESCE(t.pending, 0) AS queuePending, COALESCE(t.done, 0) AS queueDone
  FROM shops s
  LEFT JOIN (
    SELECT prefecture, shop, COUNT(*) AS total,
      SUM(status = @pending) AS pending, SUM(status = @done) AS done
    FROM targets WHERE platform = @platform AND kind = 'personal' GROUP BY prefecture, shop
  ) t ON t.prefecture = s.prefecture AND t.shop = s.name`;

// 都道府県の並びはキューと同じ PREF_RANK。値はすべてバインド変数で渡す。
const RANK_ENTRIES = Object.entries(PREF_RANK);
const RANK_CASE = `CASE s.prefecture ${RANK_ENTRIES.map((_, i) => `WHEN @rk${i} THEN @rv${i}`).join(" ")} ELSE @rdefault END`;
const RANK_PARAMS = Object.fromEntries([
  ...RANK_ENTRIES.flatMap(([pref, rank], i) => [
    [`rk${i}`, pref],
    [`rv${i}`, rank],
  ]),
  ["rdefault", PREF_RANK_DEFAULT],
]);

const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

function whereClause(filter: ShopFilter): { sql: string; params: Record<string, string> } {
  const conds: string[] = [];
  const params: Record<string, string> = {};
  if (filter.prefecture) {
    conds.push("s.prefecture = @prefecture");
    params.prefecture = filter.prefecture;
  }
  const q = filter.q?.trim();
  if (q) {
    conds.push(
      "(" +
        ["s.name", "s.kana", "s.area", "s.address"].map((col) => `${col} LIKE @q ESCAPE '\\'`).join(" OR ") +
        ")",
    );
    params.q = `%${escapeLike(q)}%`;
  }
  return { sql: conds.length ? `WHERE ${conds.join(" AND ")}` : "", params };
}

/** 店舗一覧は X / Instagram 共通。件数の集計だけ platform の名簿を数える。 */
export function createShopRepository(db: Db, platform: Platform = "x") {
  const insert = db.prepare(`INSERT INTO shops
    (shop_url, prefecture, name, kana, area, category, address, phone, official_url, email,
     instagram, x_url, tiktok, line, youtube, updated_at)
    VALUES (@shopUrl, @prefecture, @name, @kana, @area, @category, @address, @phone, @officialUrl, @email,
     @instagram, @xUrl, @tiktok, @line, @youtube, @updatedAt)`);

  return {
    replaceAll: db.transaction((shops: readonly Shop[], now: number) => {
      db.prepare("DELETE FROM shops").run();
      for (const shop of shops) insert.run({ ...shop, updatedAt: now });
    }),

    page(filter: ShopFilter, offset: number, limit: number): { total: number; items: ShopWithQueue[] } {
      const where = whereClause(filter);
      const total = db.prepare(`SELECT COUNT(*) FROM shops s ${where.sql}`).pluck().get(where.params) as number;
      const items = db
        .prepare(`${SELECT} ${where.sql} ORDER BY ${RANK_CASE}, s.name, s.shop_url LIMIT @limit OFFSET @offset`)
        .all({
          ...where.params,
          ...RANK_PARAMS,
          platform,
          pending: STATUS_PENDING,
          done: STATUS_DONE,
          limit,
          offset,
        }) as ShopWithQueue[];
      return { total, items };
    },

    prefectures(): Array<{ prefecture: string; count: number }> {
      return db
        .prepare(
          `SELECT s.prefecture AS prefecture, COUNT(*) AS count FROM shops s
           GROUP BY s.prefecture ORDER BY ${RANK_CASE}, s.prefecture`,
        )
        .all(RANK_PARAMS) as Array<{ prefecture: string; count: number }>;
    },
  };
}

export type ShopRepository = ReturnType<typeof createShopRepository>;
