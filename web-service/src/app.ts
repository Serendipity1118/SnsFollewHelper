import { Hono } from "hono";
import { errorHandler } from "./http/errors";
import { localOnly } from "./http/localOnly";
import { apiRoutes } from "./routes/api";
import { pageRoutes } from "./routes/pages";
import type { QueueService } from "./services/queueService";

export interface AppDeps {
  service: QueueService;
  /** 受け付ける Host ヘッダー（例: "127.0.0.1:8787"） */
  allowedHosts: readonly string[];
}

export function createApp({ service, allowedHosts }: AppDeps): Hono {
  const app = new Hono();
  app.use("*", localOnly(allowedHosts));
  app.route("/api", apiRoutes(service));
  app.route("/", pageRoutes(service));
  app.notFound((c) => c.text("見つかりません", 404));
  app.onError(errorHandler);
  return app;
}
