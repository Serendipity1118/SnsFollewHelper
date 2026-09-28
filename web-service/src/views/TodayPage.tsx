import { Layout } from "./Layout";

/** 今日のフォロー。指標と一覧は today.js が /api/today から描画する。 */
export function TodayPage() {
  return (
    <Layout title="今日のフォロー" active="today" scripts={["/static/today.js"]}>
      <section class="stats" id="stats" aria-label="進み具合"></section>

      <div id="quotaAlert" class="alert alert-danger" role="status" hidden>
        <p id="quotaAlertText"></p>
        <button type="button" id="resetQuota" class="btn btn-danger">
          制限をリセットする
        </button>
      </div>

      <section class="worklist" aria-labelledby="worklist-title">
        <div class="worklist-head">
          <div>
            <h1 id="worklist-title">
              今日の名簿 <span id="date" class="muted"></span>
            </h1>
            <p class="steps">
              <span>① Xで開く</span>
              <span>② 生きている個人垢なら X でフォロー</span>
              <span>③ 結果を押す（次の人へ進みます）</span>
            </p>
          </div>
          <p id="progress" class="progress-text"></p>
        </div>

        <div class="bulk" id="bulk" hidden>
          <button type="button" class="btn" id="open5">
            まとめて開く
          </button>
          <details class="menu">
            <summary class="btn btn-ghost">その他</summary>
            <div class="menu-body">
              <button type="button" class="btn btn-ghost" id="release">
                今日の名簿をすべて未着手に戻す
              </button>
            </div>
          </details>
        </div>

        <p id="message" class="notice" role="alert" hidden></p>
        <div id="list" class="rows"></div>

        <p class="keys muted">
          キー操作: <kbd>J</kbd>/<kbd>K</kbd> 移動・<kbd>O</kbd> Xで開く・<kbd>1</kbd> フォローした・<kbd>2</kbd> 見送る・
          <kbd>3</kbd> 死垢・<kbd>U</kbd> 取り消す
        </p>
      </section>

      <div id="toast" class="toast" role="status" hidden>
        <span id="toastText"></span>
        <button type="button" class="btn btn-small" id="toastUndo">
          取り消す
        </button>
      </div>
    </Layout>
  );
}
