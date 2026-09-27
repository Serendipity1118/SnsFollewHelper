import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

export type Db = Database.Database;

const SCHEMA_VERSION = 1;

const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS targets (
  handle       TEXT PRIMARY KEY,
  kind         TEXT NOT NULL CHECK (kind IN ('personal', 'shop')),
  priority     INTEGER NOT NULL,
  prefecture   TEXT NOT NULL DEFAULT '',
  shop         TEXT NOT NULL DEFAULT '',
  cast_name    TEXT NOT NULL DEFAULT '',
  profile_url  TEXT NOT NULL DEFAULT '',
  occurrences  INTEGER NOT NULL DEFAULT 1,
  last_updated TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL,
  done_date    TEXT NOT NULL DEFAULT '',
  assigned_at  INTEGER,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS targets_queue ON targets (kind, status, priority);
CREATE INDEX IF NOT EXISTS targets_assigned ON targets (kind, assigned_at);

CREATE TABLE IF NOT EXISTS action_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  handle        TEXT NOT NULL,
  status_before TEXT NOT NULL,
  status_after  TEXT NOT NULL,
  occurred_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS action_logs_follow ON action_logs (status_after, occurred_at);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

function migrate(db: Db): void {
  const current = db.pragma("user_version", { simple: true }) as number;
  if (current >= SCHEMA_VERSION) return;
  db.exec(SCHEMA_V1);
  db.pragma(`user_version = ${SCHEMA_VERSION}`);
}

/** SQLiteを開いてスキーマを最新にする。":memory:" はテスト用。 */
export function openDatabase(path: string): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}
