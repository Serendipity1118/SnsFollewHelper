import type { Db } from "./database";

export function createSettingsRepository(db: Db) {
  return {
    all(): Record<string, string> {
      const rows = db.prepare("SELECT key, value FROM settings").all() as Array<{ key: string; value: string }>;
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    },

    setMany: db.transaction((entries: ReadonlyArray<readonly [string, string]>) => {
      const upsert = db.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      );
      for (const [key, value] of entries) upsert.run(key, value);
    }),
  };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
