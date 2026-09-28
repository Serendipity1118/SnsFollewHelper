interface PagerProps {
  page: number;
  pageSize: number;
  total: number;
  href: (page: number) => string;
}

/** 「n 件中 a〜b 件」と前後ページへのリンク。 */
export function PageSummary({ page, pageSize, total }: Omit<PagerProps, "href">) {
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);
  return (
    <p class="muted result-count">
      {total.toLocaleString("ja-JP")} 件中 {from.toLocaleString("ja-JP")}〜{to.toLocaleString("ja-JP")} 件
    </p>
  );
}

export function Pager({ page, pageSize, total, href }: PagerProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage === 1) return null;
  return (
    <nav class="pager" aria-label="ページ">
      {page > 1 ? (
        <a class="btn" href={href(page - 1)}>
          ← 前へ
        </a>
      ) : (
        <span />
      )}
      <span class="muted">
        {page} / {lastPage}
      </span>
      {page < lastPage ? (
        <a class="btn" href={href(page + 1)}>
          次へ →
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}
