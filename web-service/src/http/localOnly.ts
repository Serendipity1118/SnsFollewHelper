import type { MiddlewareHandler } from "hono";
import { fail } from "./errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * ローカル専用の防御。
 * - Host が許可リスト外なら拒否（DNSリバインディング対策）
 * - 更新系は同一オリジンからのみ受け付ける（CSRF対策）
 */
export function localOnly(allowedHosts: readonly string[]): MiddlewareHandler {
  const hosts = new Set(allowedHosts.map((h) => h.toLowerCase()));
  const origins = new Set([...hosts].map((h) => `http://${h}`));
  return async (c, next) => {
    const host = (c.req.header("host") ?? "").toLowerCase();
    if (!hosts.has(host)) {
      return c.text("このサービスはローカル専用です。", 403);
    }
    if (!SAFE_METHODS.has(c.req.method)) {
      const origin = c.req.header("origin");
      const sameOrigin = origin
        ? origins.has(origin.toLowerCase())
        : c.req.header("sec-fetch-site") === "same-origin";
      if (!sameOrigin) {
        return c.json(fail("別のサイトからの操作は受け付けません。"), 403);
      }
    }
    await next();
  };
}
