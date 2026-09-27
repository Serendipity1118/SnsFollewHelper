import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { resolveDbPath } from "../../src/config/dbPath";

const SERVICE_DIR = "C:/work/worktrees/feature-x/web-service";

describe("resolveDbPath", () => {
  test("uses DB_PATH when it is set", () => {
    expect(resolveDbPath({ env: { DB_PATH: "D:/custom/app.db" }, serviceDir: SERVICE_DIR, gitCommonDir: () => "x" })).toEqual({
      path: "D:/custom/app.db",
      source: "env",
    });
  });

  test("points every worktree at the main checkout's web-service/data/app.db", () => {
    const result = resolveDbPath({
      env: {},
      serviceDir: SERVICE_DIR,
      gitCommonDir: () => "C:/00.git_repo/SnsFollewHelper/.git",
    });
    expect(result).toEqual({
      path: join("C:/00.git_repo/SnsFollewHelper", "web-service", "data", "app.db"),
      source: "git",
    });
  });

  test("falls back to the service's own data dir when git is unavailable", () => {
    const result = resolveDbPath({
      env: { DB_PATH: "" },
      serviceDir: SERVICE_DIR,
      gitCommonDir: () => {
        throw new Error("not a git repository");
      },
    });
    expect(result).toEqual({ path: join(SERVICE_DIR, "data", "app.db"), source: "local" });
  });

  test("the default git lookup resolves this repository", () => {
    const result = resolveDbPath({ env: {} });
    expect(result.source).toBe("git");
    expect(result.path.replaceAll("\\", "/")).toMatch(/\/web-service\/data\/app\.db$/);
  });
});
