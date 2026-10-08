import { STATUS_DONE } from "../domain/constants";
import type { Platform } from "../domain/platform";
import type { Db } from "./database";

export function createActionLogRepository(db: Db, platform: Platform = "x") {
  return {
    record(handle: string, statusBefore: string, statusAfter: string, occurredAt: number): void {
      db.prepare(
        "INSERT INTO action_logs (platform, handle, status_before, status_after, occurred_at) VALUES (?, ?, ?, ?, ?)",
      ).run(platform, handle, statusBefore, statusAfter, occurredAt);
    },

    /**
     * since より後に「初めて」済にした時刻（handle ごと）。
     * 取り消し→再度済や、制限リセット前に済にした行を後で済にし直しても二重に数えない。
     */
    followedSince(since: number): number[] {
      return db
        .prepare(
          `SELECT MIN(occurred_at) AS first_done FROM action_logs
           WHERE platform = ? AND status_after = ? AND status_before <> ?
           GROUP BY handle HAVING first_done > ?`,
        )
        .pluck()
        .all(platform, STATUS_DONE, STATUS_DONE, since) as number[];
    },
  };
}

export type ActionLogRepository = ReturnType<typeof createActionLogRepository>;
