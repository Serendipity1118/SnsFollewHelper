import type { Target } from "../db/targetRepository";
import type { TargetKind } from "../domain/constants";
import { Layout } from "./Layout";

export interface QueuePageProps {
  kind: TargetKind;
  status?: string;
  counts: Record<TargetKind, Record<string, number>>;
  items: readonly Target[];
  total: number;
  page: number;
  pageSize: number;
}

const KIND_LABEL: Record<TargetKind, string> = { personal: "個人キュー", shop: "店舗垢候補" };

function queueHref(kind: TargetKind, status: string | undefined, page: number, pageSize: number): string {
  const params = new URLSearchParams({ kind, page: String(page), size: String(pageSize) });
  if (status) params.set("status", status);
  return `/queue?${params.toString()}`;
}

export function QueuePage({ kind, status, counts, items, total, page, pageSize }: QueuePageProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const statuses = Object.entries(counts[kind]).sort(([a], [b]) => (a < b ? -1 : 1));
  return (
    <Layout title="キュー一覧" active="queue">
      <h1>キュー一覧</h1>
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
