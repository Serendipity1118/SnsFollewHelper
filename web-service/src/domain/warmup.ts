// docs/Xフォロー優先キュー.md のウォームアップ: 1週目10〜15、2週目20〜25、3週目以降30〜40件/日。
const STAGES = [
  { min: 10, max: 15 },
  { min: 20, max: 25 },
  { min: 30, max: 40 },
] as const;

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface WarmupGuide {
  /** 運用開始日を1週目の初日とした週 */
  week: number;
  min: number;
  max: number;
}

function toUtcDay(iso: string): number | null {
  const m = ISO_DATE.exec(iso);
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

/** 運用開始日と今日（どちらも YYYY-MM-DD）から、今週の1日あたりの目安件数を出す。 */
export function warmupGuide(startDate: string, today: string): WarmupGuide | null {
  const start = toUtcDay(startDate);
  const now = toUtcDay(today);
  if (start === null || now === null) return null;
  const days = Math.max(0, Math.round((now - start) / DAY_MS));
  const week = Math.floor(days / 7) + 1;
  const stage = STAGES[Math.min(week, STAGES.length) - 1]!;
  return { week, ...stage };
}
