import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

export type Db = Database.Database;

export const SCHEMA_V1 = `
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

// v2: pokepara_all_shops.csv の店舗一覧
const SCHEMA_V2 = `
CREATE TABLE IF NOT EXISTS shops (
  shop_url     TEXT PRIMARY KEY,
  prefecture   TEXT NOT NULL DEFAULT '',
  name         TEXT NOT NULL,
  kana         TEXT NOT NULL DEFAULT '',
  area         TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT '',
  address      TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  official_url TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL DEFAULT '',
  instagram    TEXT NOT NULL DEFAULT '',
  x_url        TEXT NOT NULL DEFAULT '',
  tiktok       TEXT NOT NULL DEFAULT '',
  line         TEXT NOT NULL DEFAULT '',
  youtube      TEXT NOT NULL DEFAULT '',
  updated_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS shops_pref_name ON shops (prefecture, name);
CREATE INDEX IF NOT EXISTS targets_shop ON targets (kind, prefecture, shop);
`;

// v3: X と Instagram の名簿を分ける。同じ handle が両方にあってよいので主キーを (platform, handle) に作り直す。
// 既存の行と履歴はすべて X のもの。
const TARGET_COLUMNS =
  "handle, kind, priority, prefecture, shop, cast_name, profile_url, occurrences, last_updated, status, done_date, assigned_at, updated_at";
const SCHEMA_V3 = `
CREATE TABLE targets_v3 (
  platform     TEXT NOT NULL DEFAULT 'x' CHECK (platform IN ('x', 'instagram')),
  handle       TEXT NOT NULL,
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
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY (platform, handle)
);
INSERT INTO targets_v3 (platform, ${TARGET_COLUMNS}) SELECT 'x', ${TARGET_COLUMNS} FROM targets;
DROP TABLE targets;
ALTER TABLE targets_v3 RENAME TO targets;
CREATE INDEX targets_queue ON targets (platform, kind, status, priority);
CREATE INDEX targets_assigned ON targets (platform, kind, assigned_at);
CREATE INDEX targets_shop ON targets (platform, kind, prefecture, shop);

ALTER TABLE action_logs ADD COLUMN platform TEXT NOT NULL DEFAULT 'x';
DROP INDEX IF EXISTS action_logs_follow;
CREATE INDEX action_logs_follow ON action_logs (platform, status_after, occurred_at);
`;

/** 添字+1 がスキーマのバージョン。既存DBは不足分だけ順に適用する。 */
export const MIGRATIONS = [SCHEMA_V1, SCHEMA_V2, SCHEMA_V3] as const;

export function migrate(db: Db, migrations: readonly string[] = MIGRATIONS): void {
  const current = db.pragma("user_version", { simple: true }) as number;
  migrations.forEach((sql, i) => {
    const version = i + 1;
    if (current >= version) return;
    db.transaction(() => {
      db.exec(sql);
      db.pragma(`user_version = ${version}`);
    })();
  });
}

/** SQLiteを開いてスキーマを最新にする。":memory:" はテスト用。 */
export function openDatabase(path: string): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}
