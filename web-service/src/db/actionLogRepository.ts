import { STATUS_DONE } from "../domain/constants";
import type { Db } from "./database";

export function createActionLogRepository(db: Db) {
  return {
    record(handle: string, statusBefore: string, statusAfter: string, occurredAt: number): void {
      db.prepare(
        "INSERT INTO action_logs (handle, status_before, status_after, occurred_at) VALUES (?, ?, ?, ?)",
      ).run(handle, statusBefore, statusAfter, occurredAt);
    },

    /** since 以降に新しく「済」にした時刻。同じ handle は最初の1回だけ数える（取り消し→再度済で二重に数えない）。 */
    followedSince(since: number): number[] {
      return db
        .prepare(
          `SELECT MIN(occurred_at) FROM action_logs
           WHERE status_after = ? AND status_before <> ? AND occurred_at > ?
           GROUP BY handle`,
        )
        .pluck()
        .all(STATUS_DONE, STATUS_DONE, since) as number[];
    },
  };
}

export type ActionLogRepository = ReturnType<typeof createActionLogRepository>;
