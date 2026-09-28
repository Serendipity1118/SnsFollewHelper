import type { Target } from "../../db/targetRepository";
import { prefectureLabel } from "../../domain/prefectures";
import { statusLabel } from "../../domain/statusLabels";
import { listHref, safeHttpUrl, type ListQuery } from "../links";
import { PageSummary, Pager } from "../Pager";

export interface TargetListProps {
  query: ListQuery & { tab: "personal" | "shop" };
  statusCounts: Record<string, number>;
  items: readonly Target[];
  total: number;
  page: number;
  pageSize: number;
}

// 状態チップの並び（作業の流れ順）。ここにない状態は後ろに付ける。
const STATUS_ORDER = ["未", "当日", "済", "既フォロー", "スキップ", "死垢", "店舗垢候補"];

const statusClass = (status: string) =>
  ({ 済: "badge-follow", 死垢: "badge-dead", 当日: "badge-today" })[status] ?? "";

function StatusChips({ query, statusCounts }: Pick<TargetListProps, "query" | "statusCounts">) {
  const statuses = Object.keys(statusCounts).sort(
    (a, b) => (STATUS_ORDER.indexOf(a) + 1 || 99) - (STATUS_ORDER.indexOf(b) + 1 || 99),
  );
  const all = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);
  const chip = (status: string | undefined, label: string, count: number) => (
    <a
      class="chip"
      href={listHref({ ...query, status, page: 1 })}
      aria-current={status === query.status ? "true" : undefined}
    >
      {label} <span class="chip-count">{count.toLocaleString("ja-JP")}</span>
    </a>
  );
  return (
    <div class="chips" aria-label="状態で絞り込む">
      {chip(undefined, "すべて", all)}
      {statuses.map((s) => chip(s, statusLabel(s), statusCounts[s] ?? 0))}
    </div>
  );
}

function TargetRow({ target }: { target: Target }) {
  const profile = safeHttpUrl(target.profileUrl);
  return (
    <tr>
      <td class="num">{target.priority}</td>
      <td>
        <strong>{target.castName}</strong>
        <div class="muted">@{target.handle}</div>
      </td>
      <td>
        {prefectureLabel(target.prefecture)}
        <div class="muted">{target.shop}</div>
      </td>
      <td>
        {target.lastUpdated || <span class="muted">不明</span>}
        {target.occurrences > 1 ? <div class="muted">出現 {target.occurrences} 回</div> : null}
      </td>
      <td>
        <span class={`badge ${statusClass(target.status)}`}>{statusLabel(target.status)}</span>
        {target.doneDate ? <div class="muted">{target.doneDate}</div> : null}
      </td>
      <td>
        {profile ? (
          <a href={profile} target="_blank" rel="noopener noreferrer">
            ポケパラ
          </a>
        ) : null}
      </td>
    </tr>
  );
}

export function TargetList({ query, statusCounts, items, total, page, pageSize }: TargetListProps) {
  return (
    <>
      <StatusChips query={query} statusCounts={statusCounts} />
      <PageSummary page={page} pageSize={pageSize} total={total} />
      {items.length ? (
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>優先度</th>
                <th>キャスト</th>
                <th>地域・店舗</th>
                <th>ポケパラ更新</th>
                <th>状態</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <TargetRow target={t} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p class="empty">条件に合う人はいません。</p>
      )}
      <Pager page={page} pageSize={pageSize} total={total} href={(p) => listHref({ ...query, page: p })} />
    </>
  );
}
