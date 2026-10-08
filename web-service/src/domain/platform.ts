// X と Instagram で違うところをまとめる。名簿・上限・設定はプラットフォームごとに独立して持つ。
import { FOLLOW_CAP } from "./constants";
import { instagramProfileUrl, normalizeHandle, normalizeInstagramHandle, xProfileUrl } from "./handle";
import { X_WARMUP_STAGES, type WarmupStage } from "./warmup";

export const PLATFORM_IDS = ["x", "instagram"] as const;
export type Platform = (typeof PLATFORM_IDS)[number];

export interface PlatformDefaults {
  batchSize: number;
  hourlyLimit: number;
  dailyLimit: number;
  operationStartDate: string;
}

export interface PlatformConfig {
  id: Platform;
  /** 画面に出す名前（「Xで開く」「Instagramフォロー」など） */
  label: string;
  /** 画面のURLの前置き。X は既存のURLを保つため空 */
  basePath: string;
  /** JSON API の前置き */
  apiBase: string;
  /** キャストCSVで handle を読む列 */
  csvColumn: string;
  normalizeHandle: (raw: string | null | undefined) => string | null;
  profileUrl: (handle: string) => string;
  /** 総フォロー数の上限の目安 */
  followCap: number;
  defaultSettings: PlatformDefaults;
  warmupStages: readonly WarmupStage[];
  /** 管理画面の上限の説明に出すウォームアップの目安 */
  warmupHint: string;
  exportNames: { personal: string; shop: string; resultsPrefix: string };
  /** settings テーブルのキーの前置き。X は既存のキーをそのまま使う */
  settingsKeyPrefix: string;
}

const INSTAGRAM_WARMUP_STAGES: readonly WarmupStage[] = [
  { min: 10, max: 20 },
  { min: 20, max: 40 },
  { min: 40, max: 60 },
];

const weekLabel = (i: number, last: boolean) => (last ? `${i + 1}週目以降` : `${i + 1}週目`);
const warmupHint = (stages: readonly WarmupStage[]) =>
  `目安: ${stages.map((s, i) => `${weekLabel(i, i === stages.length - 1)}${s.min}〜${s.max}`).join("／")}。`;

export const PLATFORMS: Readonly<Record<Platform, PlatformConfig>> = {
  x: {
    id: "x",
    label: "X",
    basePath: "",
    apiBase: "/api",
    csvColumn: "X(Twitter)",
    normalizeHandle,
    profileUrl: xProfileUrl,
    followCap: FOLLOW_CAP,
    defaultSettings: { batchSize: 15, hourlyLimit: 15, dailyLimit: 15, operationStartDate: "" },
    warmupStages: X_WARMUP_STAGES,
    warmupHint: warmupHint(X_WARMUP_STAGES),
    exportNames: { personal: "x_follow_queue.csv", shop: "x_follow_shop_candidates.csv", resultsPrefix: "follow_results" },
    settingsKeyPrefix: "",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    basePath: "/ig",
    apiBase: "/api/ig",
    csvColumn: "Instagram",
    normalizeHandle: normalizeInstagramHandle,
    profileUrl: instagramProfileUrl,
    // Instagram の仕様上のフォロー数上限
    followCap: 7500,
    defaultSettings: { batchSize: 10, hourlyLimit: 10, dailyLimit: 20, operationStartDate: "" },
    warmupStages: INSTAGRAM_WARMUP_STAGES,
    warmupHint: warmupHint(INSTAGRAM_WARMUP_STAGES),
    exportNames: {
      personal: "instagram_follow_queue.csv",
      shop: "instagram_follow_shop_candidates.csv",
      resultsPrefix: "instagram_follow_results",
    },
    settingsKeyPrefix: "instagram.",
  },
};
