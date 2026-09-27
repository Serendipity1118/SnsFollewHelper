import type { CsvRow } from "./buildQueue";

/** pokepara_all_shops.csv の1店舗。 */
export interface Shop {
  shopUrl: string;
  prefecture: string;
  name: string;
  kana: string;
  area: string;
  category: string;
  address: string;
  phone: string;
  officialUrl: string;
  email: string;
  instagram: string;
  xUrl: string;
  tiktok: string;
  line: string;
  youtube: string;
}

export const SHOP_REQUIRED_COLUMNS = ["店舗名", "店舗URL"] as const;

/** CSVの1行を Shop にする。店舗URL（主キー）か店舗名が空なら null。 */
export function shopFromCsv(row: CsvRow): Shop | null {
  const text = (key: string) => (row[key] ?? "").trim();
  const shopUrl = text("店舗URL");
  const name = text("店舗名");
  if (!shopUrl || !name) return null;
  return {
    shopUrl,
    prefecture: text("都道府県"),
    name,
    kana: text("カナ"),
    area: text("エリア"),
    category: text("業種"),
    address: text("住所"),
    phone: text("電話番号"),
    officialUrl: text("公式サイト"),
    email: text("メール"),
    instagram: text("Instagram"),
    xUrl: text("X(Twitter)"),
    tiktok: text("TikTok"),
    line: text("LINE"),
    youtube: text("YouTube"),
  };
}
