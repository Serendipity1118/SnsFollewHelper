import type { QueueItem } from "../domain/buildQueue";
import { STATUS_ASSIGNED, STATUS_PENDING, WRITABLE_STATUSES, type TargetKind } from "../domain/constants";
import type { Db } from "./database";

export interface Target extends QueueItem {
  assignedAt: number | null;
  updatedAt: number;
}

export type NewTarget = QueueItem & { assignedAt?: number | null };

const SELECT = `SELECT handle, kind, priority, prefecture, shop, cast_name AS castName,
  profile_url AS profileUrl, occurrences, last_updated AS lastUpdated, status,
  done_date AS doneDate, assigned_at AS assignedAt, updated_at AS updatedAt FROM targets`;

const WRITABLE = [...WRITABLE_STATUSES];
const WRITABLE_PLACEHOLDERS = WRITABLE.map(() => "?").join(", ");

export function createTargetRepository(db: Db) {
  const upsert = db.prepare(`INSERT INTO targets
    (handle, kind, priority, prefecture, shop, cast_name, profile_url, occurrences, last_updated,
     status, done_date, assigned_at, updated_at)
    VALUES (@handle, @kind, @priority, @prefecture, @shop, @castName, @profileUrl, @occurrences,
     @lastUpdated, @status, @doneDate, @assignedAt, @updatedAt)
    ON CONFLICT(handle) DO UPDATE SET kind = excluded.kind, priority = excluded.priority,
     prefecture = excluded.prefecture, shop = excluded.shop, cast_name = excluded.cast_name,
     profile_url = excluded.profile_url, occurrences = excluded.occurrences,
     last_updated = excluded.last_updated, status = excluded.status, done_date = excluded.done_date,
     assigned_at = excluded.assigned_at, updated_at = excluded.updated_at`);

  const insertAll = (items: readonly NewTarget[], now: number) => {
    for (const item of items) {
      upsert.run({ ...item, assignedAt: item.assignedAt ?? null, updatedAt: now });
    }
  };

  return {
    findByHandle(handle: string): Target | undefined {
      return db.prepare(`${SELECT} WHERE handle = ?`).get(handle) as Target | undefined;
    },

    byKind(kind: TargetKind): Target[] {
      return db.prepare(`${SELECT} WHERE kind = ? ORDER BY priority, handle`).all(kind) as Target[];
    },

    /** 指定した種類の行をすべて入れ替える。 */
    replaceKinds: db.transaction((kinds: readonly TargetKind[], items: readonly NewTarget[], now: number) => {
      const remove = db.prepare("DELETE FROM targets WHERE kind = ?");
      for (const kind of kinds) remove.run(kind);
      insertAll(items, now);
    }),

    /** 結果（済/スキップ/死垢）を書き込む。個人キューのみが対象。 */
    applyResult(handle: string, status: string, doneDate: string, now: number): boolean {
      const info = db
        .prepare(
          "UPDATE targets SET status = ?, done_date = ?, updated_at = ? WHERE handle = ? AND kind = 'personal'",
        )
        .run(status, doneDate, now, handle);
      return info.changes > 0;
    },

    updateStatus(handle: string, status: string, doneDate: string, assignedAt: number | null, now: number): void {
      db.prepare(
        "UPDATE targets SET status = ?, done_date = ?, assigned_at = ?, updated_at = ? WHERE handle = ?",
      ).run(status, doneDate, assignedAt, now, handle);
    },

    /** 「当日」を「未」へ戻す。before を渡すと、それより前に割り当てた行だけを戻す。 */
    releaseAssigned(now: number, before?: number): number {
      const cond = before === undefined ? "" : " AND (assigned_at IS NULL OR assigned_at < @before)";
      const info = db
        .prepare(
          `UPDATE targets SET status = @pending, assigned_at = NULL, updated_at = @now
           WHERE kind = 'personal' AND status = @assigned${cond}`,
        )
        .run({ pending: STATUS_PENDING, assigned: STATUS_ASSIGNED, now, before });
      return info.changes;
    },

    assignNext: db.transaction((limit: number, now: number): number => {
      const handles = db
        .prepare("SELECT handle FROM targets WHERE kind = 'personal' AND status = ? ORDER BY priority, handle LIMIT ?")
        .pluck()
        .all(STATUS_PENDING, limit) as string[];
      const assign = db.prepare(
        "UPDATE targets SET status = ?, done_date = '', assigned_at = ?, updated_at = ? WHERE handle = ?",
      );
      for (const handle of handles) assign.run(STATUS_ASSIGNED, now, now, handle);
      return handles.length;
    }),

    assignedSince(since: number): Target[] {
      return db
        .prepare(`${SELECT} WHERE kind = 'personal' AND assigned_at >= ? ORDER BY priority, handle`)
        .all(since) as Target[];
    },

    counts(): Array<{ kind: TargetKind; status: string; count: number }> {
      return db
        .prepare("SELECT kind, status, COUNT(*) AS count FROM targets GROUP BY kind, status")
        .all() as Array<{ kind: TargetKind; status: string; count: number }>;
    },

    page(kind: TargetKind, status: string | undefined, offset: number, limit: number) {
      const where = status ? "WHERE kind = @kind AND status = @status" : "WHERE kind = @kind";
      const params = { kind, status, offset, limit };
      const total = db.prepare(`SELECT COUNT(*) FROM targets ${where}`).pluck().get(params) as number;
      const items = db
        .prepare(`${SELECT} ${where} ORDER BY priority, handle LIMIT @limit OFFSET @offset`)
        .all(params) as Target[];
      return { total, items };
    },

    /** 済/スキップ/死垢 の個人キュー。実施日の新しい順。 */
    finished(doneDate?: string): Target[] {
      const dateCond = doneDate ? " AND done_date = ?" : "";
      const params = doneDate ? [...WRITABLE, doneDate] : WRITABLE;
      return db
        .prepare(
          `${SELECT} WHERE kind = 'personal' AND status IN (${WRITABLE_PLACEHOLDERS})${dateCond}
           ORDER BY done_date DESC, priority, handle`,
        )
        .all(...params) as Target[];
    },
  };
}

export type TargetRepository = ReturnType<typeof createTargetRepository>;
