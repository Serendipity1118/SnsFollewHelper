import { Layout } from "./Layout";

/** 当日キュー。一覧は today.js が /api/today から描画する。 */
export function TodayPage() {
  return (
    <Layout title="当日キュー" active="today" scripts={["/static/today.js"]}>
      <h1>
        Xフォロー当日キュー <span id="date" class="meta"></span>
      </h1>
      <p class="meta">
        プロフィールを見て、生きている個人垢だけ手動でフォローする。店舗垢・死垢はスキップ。押した結果はすぐ保存される。
      </p>
      <details class="howto">
        <summary>使い方</summary>
        <ol>
          <li>
            <strong>次の件を出す</strong> で今日の名簿を作る（前日までに残った「当日」は自動で未に戻る）。
          </li>
          <li>
            <strong>Xを開く</strong>（<kbd>O</kbd>）でプロフィールを開き、手動でフォローする。先頭から開くときは{" "}
            <strong>未処理の5件を開く</strong>（残り枠の分だけ開く）。
          </li>
          <li>
            <strong>済</strong>（<kbd>1</kbd>）／<strong>スキップ</strong>（<kbd>2</kbd>）／<strong>死垢</strong>（
            <kbd>3</kbd>）。<kbd>J</kbd>
            <kbd>K</kbd> で移動、<kbd>U</kbd> で直前を取り消す。
          </li>
          <li>フォロー上限に達すると「開く」が止まる。結果の入力はそのまま続けられる。</li>
        </ol>
      </details>
      <div class="toolbar">
        <button type="button" class="primary" id="next">
          次の件を出す
        </button>
        <button type="button" id="open5">
          未処理の5件を開く
        </button>
        <button type="button" id="done5">
          上から5件を済にする
        </button>
        <button type="button" id="undo">
          直前を取り消す
        </button>
        <button type="button" id="release" class="subtle">
          当日をすべて未に戻す
        </button>
        <span class="count" id="progress"></span>
      </div>
      <p id="quota" class="quota" role="status"></p>
      <p id="message" class="message" role="alert"></p>
      <main id="list"></main>
    </Layout>
  );
}
