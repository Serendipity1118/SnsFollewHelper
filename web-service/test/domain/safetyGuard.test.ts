import { describe, expect, test } from "vitest";
import { evaluateQuota, HOUR_MS, DAY_MS } from "../../src/domain/safetyGuard";

const NOW = Date.UTC(2026, 8, 28, 12, 0, 0);
const limits = { hourlyLimit: 3, dailyLimit: 5 };

describe("evaluateQuota", () => {
  test("full quota when nothing followed", () => {
    expect(evaluateQuota([], limits, NOW)).toEqual({
      followed1h: 0,
      followed24h: 0,
      remaining1h: 3,
      remaining24h: 5,
      remaining: 3,
      blocked: false,
      retryAt: null,
    });
  });

  test("ignores events outside the 24h window", () => {
    const q = evaluateQuota([NOW - DAY_MS - 1], limits, NOW);
    expect(q.followed24h).toBe(0);
  });

  test("blocks on the hourly limit and retries when the oldest hourly event expires", () => {
    const events = [NOW - 50 * 60_000, NOW - 20 * 60_000, NOW - 10 * 60_000];
    const q = evaluateQuota(events, limits, NOW);
    expect(q.remaining1h).toBe(0);
    expect(q.remaining).toBe(0);
    expect(q.blocked).toBe(true);
    expect(q.retryAt).toBe(NOW - 50 * 60_000 + HOUR_MS);
  });

  test("blocks on the daily limit and uses the later retry time", () => {
    const events = [
      NOW - 20 * HOUR_MS,
      NOW - 10 * HOUR_MS,
      NOW - 5 * HOUR_MS,
      NOW - 3 * HOUR_MS,
      NOW - 30 * 60_000,
    ];
    const q = evaluateQuota(events, limits, NOW);
    expect(q.remaining1h).toBe(2);
    expect(q.remaining24h).toBe(0);
    expect(q.blocked).toBe(true);
    expect(q.retryAt).toBe(NOW - 20 * HOUR_MS + DAY_MS);
  });

  test("remaining never goes negative when limits were lowered", () => {
    const events = [NOW - 1000, NOW - 2000, NOW - 3000, NOW - 4000];
    const q = evaluateQuota(events, { hourlyLimit: 2, dailyLimit: 10 }, NOW);
    expect(q.remaining1h).toBe(0);
    // 4件中、上限2を下回るには古い3件が抜ける必要がある → 3番目に古い (2000ms前) が基準
    expect(q.retryAt).toBe(NOW - 2000 + HOUR_MS);
  });
});
