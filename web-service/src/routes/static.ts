import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TYPES = {
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
} as const;

// 配信するファイルは許可リストのみ（パストラバーサル対策）。起動時に読み込む。
const FILES = ["today.js", "forms.js", "style.css"] as const;

export const STATIC_ASSETS: ReadonlyMap<string, { body: string; type: string }> = new Map(
  FILES.map((name) => {
    const ext = name.split(".").pop() as keyof typeof TYPES;
    const body = readFileSync(fileURLToPath(new URL(`../public/${name}`, import.meta.url)), "utf8");
    return [name, { body, type: TYPES[ext] }];
  }),
);
