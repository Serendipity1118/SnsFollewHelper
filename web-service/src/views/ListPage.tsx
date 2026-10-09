import type { PlatformConfig } from "../domain/platform";
import { Icon } from "./icons";
import { Layout } from "./Layout";
import { PageHeading } from "./PageHeading";
import { listHref, type ListQuery, type ListTab } from "./links";
import { ShopList, type ShopListProps } from "./list/ShopList";
import { TargetList, type TargetListProps } from "./list/TargetList";

export interface PrefectureOption {
  prefecture: string;
  label: string;
  count: number;
}

interface CommonProps {
  platform: PlatformConfig;
  tabCounts: Record<ListTab, number>;
  prefectures: readonly PrefectureOption[];
}

export type ListPageProps = CommonProps &
  ({ view: "targets"; list: TargetListProps } | { view: "shops"; list: ShopListProps });

const TABS: ReadonlyArray<{ tab: ListTab; label: string }> = [
  { tab: "personal", label: "個人" },
  { tab: "shop", label: "店舗垢候補" },
  { tab: "shops", label: "店舗" },
];

const PLACEHOLDER: Record<ListTab, string> = {
  personal: "名前・@handle・店舗名",
  shop: "名前・@handle・店舗名",
  shops: "店舗名・カナ・エリア・住所",
};

/** 見出し右のボタン。個人・店舗垢候補のタブでは、その名簿のCSVを書き出せる。 */
function HeadingActions({ platform, tab }: { platform: PlatformConfig; tab: ListTab }) {
  return (
    <>
      <a class="btn" href={`${platform.basePath}/admin#data`}>
        <Icon name="upload" />
        データを更新
      </a>
      {tab === "shops" ? null : (
        <a class="btn" href={`${platform.apiBase}/export/queue.csv?kind=${tab}`}>
          <Icon name="download" />
          CSVで書き出す
        </a>
      )}
    </>
  );
}

function SearchForm({ query, prefectures }: { query: ListQuery; prefectures: readonly PrefectureOption[] }) {
  const filtered = Boolean(query.q || query.prefecture || query.shop || query.status);
  return (
    <form class="search card" method="get" action={`${query.base ?? ""}/list`} role="search">
      <input type="hidden" name="tab" value={query.tab} />
      {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
      {query.shop ? <input type="hidden" name="shop" value={query.shop} /> : null}
      <label class="field search-keyword">
        <span class="field-label">キーワード</span>
        <span class="input-icon">
          <Icon name="search" />
          <input type="search" name="q" value={query.q ?? ""} placeholder={PLACEHOLDER[query.tab]} />
        </span>
      </label>
      <label class="field">
        <span class="field-label">都道府県</span>
        <select name="pref">
          <option value="">すべての都道府県</option>
          {prefectures.map((p) => (
            <option value={p.prefecture} selected={p.prefecture === query.prefecture}>
              {p.label}（{p.count.toLocaleString("ja-JP")}）
            </option>
          ))}
        </select>
      </label>
      <div class="search-actions">
        <button type="submit" class="btn btn-primary">
          <Icon name="search" />
          検索
        </button>
        {filtered ? (
          <a class="btn btn-ghost" href={listHref({ base: query.base, tab: query.tab })}>
            条件をクリア
          </a>
        ) : null}
      </div>
    </form>
  );
}

export function ListPage(props: ListPageProps) {
  const query = props.list.query;
  return (
    <Layout title="名簿" platform={props.platform} active="list">
      <PageHeading
        icon="users"
        eyebrow="Roster"
        title="名簿"
        lead="ポケパラから取り込んだキャストと店舗の一覧です。優先度の高い順に今日の名簿へ入ります。"
        actions={<HeadingActions platform={props.platform} tab={query.tab} />}
      />
      <nav class="tabs" aria-label="名簿の種類">
        {TABS.map(({ tab, label }) => (
          <a href={listHref({ base: query.base, tab })} aria-current={tab === query.tab ? "page" : undefined}>
            {label} <span class="chip-count">{props.tabCounts[tab].toLocaleString("ja-JP")}</span>
          </a>
        ))}
      </nav>
      {query.tab === "shop" ? (
        <p class="note">5人以上が同じ{props.platform.label}を載せていたアカウント（店舗・グループ垢の可能性）。通常はフォローせず、非公開リストで見るだけにします。</p>
      ) : null}
      {query.shop ? (
        <p class="filter-note">
          店舗「{query.shop}」の人だけを表示しています。 <a href={listHref({ base: query.base, tab: query.tab })}>解除</a>
        </p>
      ) : null}
      <SearchForm query={query} prefectures={props.prefectures} />
      {props.view === "shops" ? (
        props.tabCounts.shops === 0 ? (
          <p class="empty card">
            店舗一覧はまだありません。<a href={`${query.base ?? ""}/admin#data`}>管理 → データ更新</a> で pokepara_all_shops.csv を取り込んでください。
          </p>
        ) : (
          <ShopList {...props.list} />
        )
      ) : (
        <TargetList {...props.list} />
      )}
    </Layout>
  );
}
