import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { createApp } from "./app";
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
const dbPath = process.env.DB_PATH || fileURLToPath(new URL("../data/app.db", import.meta.url));
const db = openDatabase(dbPath);
const app = createApp({
  service: createQueueService(db),
  allowedHosts: [`${HOSTNAME}:${port}`, `localhost:${port}`],
});

const server = serve({ fetch: app.fetch, port, hostname: HOSTNAME }, (info) => {
  console.info(`Xフォロー優先キュー: http://${HOSTNAME}:${info.port}  (DB: ${dbPath})`);
});

function shutdown() {
  server.close();
  db.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
