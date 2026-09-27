import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { openDatabase } from "../src/db/database";
import { createQueueService } from "../src/services/queueService";

export const fixture = (name: string) =>
  readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), "utf8");

/** テスト用の差し替え可能な時計。 */
export function fakeClock(start: Date) {
  let current = start.getTime();
  return {
    now: () => new Date(current),
    advance(ms: number) {
      current += ms;
    },
    set(at: Date) {
      current = at.getTime();
    },
  };
}

export function createTestService(start = new Date(2026, 8, 28, 10, 0, 0)) {
  const db = openDatabase(":memory:");
  const clock = fakeClock(start);
  const service = createQueueService(db, clock.now);
  return { db, clock, service };
}

export const MINUTE_MS = 60_000;
