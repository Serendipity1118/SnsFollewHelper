import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** web-service/ ディレクトリ（src/config から2つ上）。 */
const DEFAULT_SERVICE_DIR = fileURLToPath(new URL("../../", import.meta.url));

export type DbPathSource = "env" | "git" | "local";

export interface ResolveDbPathOptions {
  env?: Record<string, string | undefined>;
  serviceDir?: string;
  /** `git rev-parse --git-common-dir` の結果（テストで差し替える） */
  gitCommonDir?: (cwd: string) => string;
}

function gitCommonDirFromGit(cwd: string): string {
  return execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

/**
 * DBの場所を決める。
 * 1. DB_PATH があればそれ
 * 2. git リポジトリ内なら、どのワークツリーから起動しても本体チェックアウトの web-service/data/app.db
 *    （git の共通ディレクトリ .git の親 = 本体チェックアウト）
 * 3. それ以外は web-service/data/app.db
 */
export function resolveDbPath(options: ResolveDbPathOptions = {}): { path: string; source: DbPathSource } {
  const env = options.env ?? process.env;
  const serviceDir = options.serviceDir ?? DEFAULT_SERVICE_DIR;
  const fromEnv = env.DB_PATH?.trim();
  if (fromEnv) return { path: fromEnv, source: "env" };
  try {
    const commonDir = (options.gitCommonDir ?? gitCommonDirFromGit)(serviceDir);
    const mainCheckout = dirname(resolve(serviceDir, commonDir));
    return { path: join(mainCheckout, "web-service", "data", "app.db"), source: "git" };
  } catch {
    return { path: join(serviceDir, "data", "app.db"), source: "local" };
  }
}
