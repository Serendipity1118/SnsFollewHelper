import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { resolveDbPath } from "./config/dbPath";
import { extensionOrigin } from "./config/extension";
import { openDatabase } from "./db/database";
import { createQueueService } from "./services/queueService";

// ローカル専用。外部インターフェースでは待ち受けない。
const HOSTNAME = "127.0.0.1";
const DEFAULT_PORT = 8787;

function readPort(raw: string | undefined): number {
  if (raw === undefined || raw === "") return DEFAULT_PORT;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT が不正です: ${raw}`);
  }
  return port;
}

const port = readPort(process.env.PORT);
// どのワークツリーから起動しても同じDB（本体チェックアウトの web-service/data/app.db）を使う
const { path: dbPath, source: dbSource } = resolveDbPath();
const db = openDatabase(dbPath);
const app = createApp({
  service: createQueueService(db),
  instagramService: createQueueService(db, undefined, "instagram"),
  allowedHosts: [`${HOSTNAME}:${port}`, `localhost:${port}`],
  extensionOrigins: [extensionOrigin(process.env.EXTENSION_ID)],
});

const server = serve({ fetch: app.fetch, port, hostname: HOSTNAME }, (info) => {
  console.info(`フォロー優先キュー（X / Instagram）: http://${HOSTNAME}:${info.port}  (DB: ${dbPath} [${dbSource}])`);
});

function shutdown() {
  server.close();
  db.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
