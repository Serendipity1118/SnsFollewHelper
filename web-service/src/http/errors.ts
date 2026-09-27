import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { CsvFormatError } from "../csv/parse";
import { QueueError } from "../services/queueService";

/** 入力不備（400）。 */
export class BadRequest extends Error {}

export const ok = <T>(data: T) => ({ ok: true as const, data });
export const fail = (error: string) => ({ ok: false as const, error });

export function errorHandler(err: Error, c: Context) {
  if (err instanceof QueueError) {
    return c.json(fail(err.message), err.code === "not_found" ? 404 : 400);
  }
  if (err instanceof CsvFormatError || err instanceof BadRequest) {
    return c.json(fail(err.message), 400);
  }
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error("[follow-queue-web] unexpected error", c.req.method, c.req.path, err);
  return c.json(fail("サーバーでエラーが発生しました。ターミナルのログを確認してください。"), 500);
}
