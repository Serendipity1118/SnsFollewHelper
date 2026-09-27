export const HOUR_MS = 3_600_000;
export const DAY_MS = 24 * HOUR_MS;

export interface Limits {
  hourlyLimit: number;
  dailyLimit: number;
}

export interface Quota {
  followed1h: number;
  followed24h: number;
  remaining1h: number;
  remaining24h: number;
  /** 今開いてよい件数（1h と 24h の小さい方） */
  remaining: number;
  blocked: boolean;
  /** 上限に達しているとき、再開できる時刻（epoch ms） */
  retryAt: number | null;
}

interface WindowResult {
  count: number;
  remaining: number;
  retryAt: number | null;
}

function evaluateWindow(sortedAsc: readonly number[], limit: number, windowMs: number, now: number): WindowResult {
  const inWindow = sortedAsc.filter((t) => t > now - windowMs && t <= now);
  const count = inWindow.length;
  const remaining = Math.max(0, limit - count);
  if (remaining > 0) return { count, remaining, retryAt: null };
  // 上限未満に戻るには、古い方から (count - limit + 1) 件が窓から抜ける必要がある
  const pivot = inWindow[count - limit] ?? inWindow[0]!;
  return { count, remaining, retryAt: pivot + windowMs };
}

/**
 * 直近1時間・24時間に新しく「済」にした時刻から残り枠を出す。
 * Flutter版 SafetyGuard と同じく、上限到達時は新しいプロフィールを開かせない。結果入力は止めない。
 */
export function evaluateQuota(followedAt: readonly number[], limits: Limits, now: number): Quota {
  const sorted = [...followedAt].sort((a, b) => a - b);
  const hour = evaluateWindow(sorted, limits.hourlyLimit, HOUR_MS, now);
  const day = evaluateWindow(sorted, limits.dailyLimit, DAY_MS, now);
  const retries = [hour.retryAt, day.retryAt].filter((t): t is number => t !== null);
  const remaining = Math.min(hour.remaining, day.remaining);
  return {
    followed1h: hour.count,
    followed24h: day.count,
    remaining1h: hour.remaining,
    remaining24h: day.remaining,
    remaining,
    blocked: remaining === 0,
    retryAt: retries.length ? Math.max(...retries) : null,
  };
}
