import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "@playwright/test";

// wrangler dev などが使う 87xx 番台と衝突しないポート
const PORT = 18799;
// E2Eは毎回まっさらなDBで動かす（実データの data/app.db には触れない）
const dbPath = join(tmpdir(), `follow-queue-e2e-${process.pid}.db`);

export default defineConfig({
  testDir: "test/e2e",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  webServer: {
    command: "npx tsx src/server.ts",
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    env: { PORT: String(PORT), DB_PATH: dbPath },
  },
});
