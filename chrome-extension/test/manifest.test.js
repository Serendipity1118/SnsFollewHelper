import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();
const manifest = JSON.parse(readFileSync(resolve(root, "manifest.json"), "utf8"));
const SIZES = ["16", "32", "48", "128"];

describe("manifest のアイコン", () => {
  test("拡張とツールバーの両方に 16/32/48/128px のロゴを指定している", () => {
    expect(Object.keys(manifest.icons)).toEqual(SIZES);
    expect(Object.keys(manifest.action.default_icon)).toEqual(SIZES);
  });

  test("指定したアイコンのファイルがすべて存在する", () => {
    const paths = [...Object.values(manifest.icons), ...Object.values(manifest.action.default_icon)];
    for (const path of paths) expect(existsSync(resolve(root, path)), path).toBe(true);
  });
});
