import type { Settings } from "../services/queueService";
import { Layout } from "./Layout";

function NumberField(props: { name: keyof Settings; label: string; value: number; max: number; hint: string }) {
  return (
    <label class="field">
      <span>{props.label}</span>
      <input type="number" name={props.name} value={String(props.value)} min="1" max={String(props.max)} required />
      <small class="meta">{props.hint}</small>
    </label>
  );
}

export function SettingsPage({ settings }: { settings: Settings }) {
  return (
    <Layout title="設定" active="settings" scripts={["/static/forms.js"]}>
      <h1>設定</h1>
      <form class="card" data-api="/api/settings" data-method="PUT" data-json>
        <NumberField
          name="batchSize"
          label="1回に出す件数"
          value={settings.batchSize}
          max={100}
          hint="「次の件を出す」で当日にする件数。1セッション連続は15件まで。"
        />
        <NumberField
          name="hourlyLimit"
          label="直近1時間のフォロー上限"
          value={settings.hourlyLimit}
          max={200}
          hint="新しく「済」にした件数で数える。"
        />
        <NumberField
          name="dailyLimit"
          label="直近24時間のフォロー上限"
          value={settings.dailyLimit}
          max={1000}
          hint="目安: 1週目10〜15、2週目20〜25、3週目以降30〜40。"
        />
        <button type="submit" class="primary">
          保存
        </button>
        <pre class="result" data-result></pre>
      </form>
    </Layout>
  );
}
