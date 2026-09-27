import { Layout } from "./Layout";

function UploadForm(props: { action: string; title: string; description: string; withKind?: boolean }) {
  return (
    <form class="card" data-api={props.action} data-method="POST" enctype="multipart/form-data">
      <h2>{props.title}</h2>
      <p class="meta">{props.description}</p>
      <input type="file" name="file" accept=".csv,text/csv" required />
      {props.withKind ? (
        <select name="kind">
          <option value="personal">個人キュー（x_follow_queue.csv）</option>
          <option value="shop">店舗垢候補（x_follow_shop_candidates.csv）</option>
        </select>
      ) : null}
      <button type="submit" class="primary">
        取り込む
      </button>
      <pre class="result" data-result></pre>
    </form>
  );
}

export function ImportPage() {
  return (
    <Layout title="取込・出力" active="import" scripts={["/static/forms.js"]}>
      <h1>取込・出力</h1>
      <UploadForm
        action="/api/import/casts"
        title="元データからキューを作る"
        description="pokepara_all_casts.csv（X(Twitter) 列が必要）。handle ごとにまとめて優先度を付け直す。済・スキップ・死垢などの進捗はそのまま残る。"
      />
      <UploadForm
        action="/api/import/queue"
        title="既存のキューCSVを取り込む（移行用）"
        description="旧ツールの x_follow_queue.csv / x_follow_shop_candidates.csv。選んだ種類の中身を置き換える。結果の付いていない「当日」は「未」に戻す。"
        withKind
      />
      <UploadForm
        action="/api/import/results"
        title="旧 today.html の結果CSVを反映する"
        description="follow_results_*.csv（handle, 状態, 実施日）。済・スキップ・死垢だけを書き込む。"
      />
      <UploadForm
        action="/api/import/shops"
        title="店舗一覧を取り込む"
        description="pokepara_all_shops.csv（店舗名・店舗URL 列が必要）。店舗一覧の中身を入れ替える。キューには影響しない。"
      />
      <section class="card">
        <h2>CSVで書き出す</h2>
        <p class="meta">旧ツールと同じ列・UTF-8(BOM)・CRLF。</p>
        <ul class="links">
          <li>
            <a href="/api/export/queue.csv?kind=personal">個人キュー（x_follow_queue.csv）</a>
          </li>
          <li>
            <a href="/api/export/queue.csv?kind=shop">店舗垢候補（x_follow_shop_candidates.csv）</a>
          </li>
          <li>
            <a href="/api/export/results.csv">結果すべて（handle, 状態, 実施日）</a>
          </li>
        </ul>
      </section>
    </Layout>
  );
}
