import type { PlatformConfig } from "../domain/platform";
import { Icon } from "./icons";
import { Layout } from "./Layout";
import { PageHeading } from "./PageHeading";

/** 今日のフォロー。指標と一覧は today.js が /api/today から描画する。 */
export function TodayPage({ platform }: { platform: PlatformConfig }) {
  const label = platform.label;
  return (
    <Layout title="今日のフォロー" platform={platform} active="today" scripts={["/static/today.js"]}>
      <div
        id="today"
        hidden
        data-api-base={platform.apiBase}
        data-base-path={platform.basePath}
        data-label={label}
        data-platform={platform.id}
      ></div>
      <PageHeading
        icon="calendar-check"
        eyebrow="Today's follow queue"
        title="今日のフォロー"
        lead={
          <>
            今日の名簿<span id="date"></span>です。上から順に開いて、生きている個人垢なら自分でフォローしてください。
          </>
        }
        actions={
          <button type="button" class="btn btn-ghost" id="release" hidden>
            <Icon name="rotate-ccw" />
            未着手に戻す
          </button>
        }
      />

      <section class="stats" id="stats" aria-label="進み具合"></section>

      <div id="quotaAlert" class="alert alert-danger" role="status" hidden>
        <Icon name="alert-triangle" />
        <p id="quotaAlertText"></p>
        <button type="button" id="resetQuota" class="btn btn-danger btn-small">
          制限をリセットする
        </button>
      </div>

      <section class="worklist" aria-label="今日の名簿">
        <ol class="steps">
          <li>
            <b>1</b>
            {label}で開く
          </li>
          <li>
            <b>2</b>生きている個人垢なら {label} でフォロー
          </li>
          <li>
            <b>3</b>結果を押す（次の人へ進みます）
          </li>
        </ol>

        <div class="bulk" id="bulk" hidden>
          <p id="progress" class="progress-text"></p>
          <p class="keys">
            <kbd>J</kbd>
            <kbd>K</kbd> 移動 <kbd>O</kbd> 開く <kbd>1</kbd>
            <kbd>2</kbd>
            <kbd>3</kbd> 結果 <kbd>U</kbd> 取り消し
          </p>
          <button type="button" class="btn btn-primary" id="open5">
            <Icon name="layers" />
            <span id="open5Label">まとめて開く</span>
          </button>
        </div>

        <p id="message" class="notice" role="alert" hidden></p>
        <div id="list" class="rows"></div>
      </section>

      <div id="toast" class="toast" role="status" hidden>
        <Icon name="check" />
        <span id="toastText"></span>
        <button type="button" class="toast-undo" id="toastUndo">
          取り消す
        </button>
        <button type="button" class="toast-close" id="toastClose" aria-label="閉じる">
          <Icon name="x" />
        </button>
      </div>
    </Layout>
  );
}
