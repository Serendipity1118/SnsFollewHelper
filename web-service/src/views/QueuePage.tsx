import type { Target } from "../db/targetRepository";
import type { TargetKind } from "../domain/constants";
import { Layout } from "./Layout";
import { queueHref as buildQueueHref } from "./links";

export interface QueuePageProps {
  kind: TargetKind;
  status?: string;
  /** 店舗一覧から来たときの絞り込み（都道府県+店舗名） */
  prefecture?: string;
  shop?: string;
  counts: Record<TargetKind, Record<string, number>>;
  items: readonly Target[];
  total: number;
  page: number;
  pageSize: number;
}

const KIND_LABEL: Record<TargetKind, string> = { personal: "個人キュー", shop: "店舗垢候補" };

export function QueuePage({ kind, status, prefecture, shop, counts, items, total, page, pageSize }: QueuePageProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const statuses = Object.entries(counts[kind]).sort(([a], [b]) => (a < b ? -1 : 1));
  const queueHref = (k: TargetKind, s: string | undefined, p: number, size: number) =>
    buildQueueHref({ kind: k, status: s, prefecture, shop, page: p, size });
  return (
    <Layout title="キュー一覧" active="queue">
      <h1>キュー一覧</h1>
      {shop || prefecture ? (
        <p class="filter-note">
          絞り込み中: {[prefecture, shop].filter(Boolean).join(" / ")}{" "}
          <a href={buildQueueHref({ kind, status, size: pageSize })}>解除</a>
          （状態ごとの件数は全体の件数）
        </p>
      ) : null}
      <div class="filters">
        {(Object.keys(KIND_LABEL) as TargetKind[]).map((k) => (
          <a href={queueHref(k, undefined, 1, pageSize)} class={k === kind ? "chip current" : "chip"}>
            {KIND_LABEL[k]}
          </a>
        ))}
      </div>
      <div class="filters">
        <a href={queueHref(kind, undefined, 1, pageSize)} class={status ? "chip" : "chip current"}>
          すべて
        </a>
        {statuses.map(([s, n]) => (
          <a href={queueHref(kind, s, 1, pageSize)} class={s === status ? "chip current" : "chip"}>
            {s} {n}
          </a>
        ))}
      </div>
      <p class="meta">
        {total} 件中 {total ? (page - 1) * pageSize + 1 : 0}〜{Math.min(page * pageSize, total)} 件
      </p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>優先度</th>
              <th>handle</th>
              <th>キャスト名</th>
              <th>都道府県 / 店舗</th>
              <th>出現</th>
              <th>更新</th>
              <th>状態</th>
              <th>実施日</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr>
                <td class="num">{t.priority}</td>
                <td>@{t.handle}</td>
                <td>{t.castName}</td>
                <td>
                  {t.prefecture} / {t.shop}
                </td>
                <td class="num">{t.occurrences}</td>
                <td>{t.lastUpdated}</td>
                <td>{t.status}</td>
                <td>{t.doneDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav class="pager">
        {page > 1 ? <a href={queueHref(kind, status, page - 1, pageSize)}>← 前へ</a> : <span />}
        <span class="meta">
          {page} / {lastPage}
        </span>
        {page < lastPage ? <a href={queueHref(kind, status, page + 1, pageSize)}>次へ →</a> : <span />}
      </nav>
    </Layout>
  );
}
