import type { Settings } from "../services/queueService";
import { Layout } from "./Layout";

interface AdminPageProps {
  settings: Settings;
  /** 運用開始日を空欄にしたときに使う日（最初に「済」にした日） */
  firstFollowDate: string | null;
}

function NumberField(props: { name: keyof Settings; label: string; value: number; max: number; hint: string }) {
  return (
    <label class="field">
      <span class="field-label">{props.label}</span>
      <input type="number" name={props.name} value={String(props.value)} min="1" max={String(props.max)} required />
      <small class="muted">{props.hint}</small>
    </label>
  );
}

function UploadForm(props: { action: string; title: string; description: string; withKind?: boolean }) {
  return (
    <form class="upload" data-api={props.action} data-method="POST" enctype="multipart/form-data">
      <h3>{props.title}</h3>
      <p class="muted">{props.description}</p>
      <div class="upload-row">
        <input type="file" name="file" accept=".csv,text/csv" required aria-label={`${props.title}のCSV`} />
        {props.withKind ? (
          <select name="kind" aria-label="種類">
            <option value="personal">個人（x_follow_queue.csv）</option>
            <option value="shop">店舗垢候補（x_follow_shop_candidates.csv）</option>
          </select>
        ) : null}
        <button type="submit" class="btn btn-primary">
          取り込む
        </button>
      </div>
      <p class="result" data-result role="status"></p>
    </form>
  );
}

function SettingsSection({ settings, firstFollowDate }: AdminPageProps) {
  return (
    <section class="card" id="settings">
      <h2>設定</h2>
      <form class="settings-form" data-api="/api/settings" data-method="PUT" data-json>
        <div class="field-grid">
          <NumberField
            name="batchSize"
            label="1回に名簿へ入れる件数"
            value={settings.batchSize}
            max={100}
            hint="1セッション連続は15件まで。"
          />
          <NumberField
            name="hourlyLimit"
            label="1時間あたりの上限"
            value={settings.hourlyLimit}
            max={200}
            hint="直近1時間に「フォローした」にした件数。"
          />
          <NumberField
            name="dailyLimit"
            label="24時間あたりの上限"
            value={settings.dailyLimit}
            max={1000}
            hint="目安: 1週目10〜15／2週目20〜25／3週目以降30〜40。"
          />
          <label class="field">
            <span class="field-label">運用開始日</span>
            <input type="date" name="operationStartDate" value={settings.operationStartDate} />
            <small class="muted">
              ウォームアップの何週目かを数える起点。空欄なら最初にフォローした日
              {firstFollowDate ? `（${firstFollowDate}）` : "（まだありません）"}。
            </small>
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            保存
          </button>
          <p class="result" data-result role="status"></p>
        </div>
      </form>
    </section>
  );
}

export function AdminPage(props: AdminPageProps) {
  return (
    <Layout title="管理" active="admin" scripts={["/static/forms.js"]}>
      <h1>管理</h1>
      <SettingsSection {...props} />

      <section class="card" id="data">
        <h2>データ更新</h2>
        <p class="muted">ポケパラから取り直した CSV を入れるときに使います。</p>
        <UploadForm
          action="/api/import/casts"
          title="キャスト名簿（pokepara_all_casts.csv）"
          description="X(Twitter) 列が必要。handle ごとに優先度を付け直します。フォローした・見送りなどの結果はそのまま残ります。"
        />
        <UploadForm
          action="/api/import/shops"
          title="店舗一覧（pokepara_all_shops.csv）"
          description="店舗名・店舗URL 列が必要。店舗一覧を入れ替えます。名簿には影響しません。"
        />
      </section>

      <section class="card" id="export">
        <h2>書き出し</h2>
        <p class="muted">旧ツールと同じ列・UTF-8(BOM)・CRLF。Excel で直接開かず、テキストエディタか取込で扱ってください。</p>
        <ul class="download-list">
          <li>
            <a class="btn" href="/api/export/queue.csv?kind=personal">
              個人の名簿（x_follow_queue.csv）
            </a>
          </li>
          <li>
            <a class="btn" href="/api/export/queue.csv?kind=shop">
              店舗垢候補（x_follow_shop_candidates.csv）
            </a>
          </li>
          <li>
            <a class="btn" href="/api/export/results.csv">
              結果すべて（handle, 状態, 実施日）
            </a>
          </li>
        </ul>
      </section>

      <details class="card" id="migration">
        <summary>
          <h2>旧ツールからの移行</h2>
          <span class="muted">Python 版の CSV を引き継ぐときだけ使います</span>
        </summary>
        <UploadForm
          action="/api/import/queue"
          title="既存のキューCSV"
          description="x_follow_queue.csv / x_follow_shop_candidates.csv。選んだ種類の中身を置き換えます。結果の付いていない「当日」は未着手に戻します。"
          withKind
        />
        <UploadForm
          action="/api/import/results"
          title="today.html の結果CSV"
          description="follow_results_*.csv（handle, 状態, 実施日）。済・既フォロー・スキップ・死垢だけを書き込みます。"
        />
      </details>
    </Layout>
  );
}
