import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TYPES = {
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  png: "image/png",
} as const;

// 配信するファイルは許可リストのみ（パストラバーサル対策）。起動時に読み込む。
const FILES = [
  "today.js",
  "forms.js",
  "shell.js",
  "style.css",
  "logo-mark.png",
  "favicon-32.png",
  "favicon-16.png",
  "apple-touch-icon.png",
] as const;

export interface StaticAsset {
  body: string | Uint8Array<ArrayBuffer>;
  type: string;
}

function load(name: string): StaticAsset {
  const ext = name.split(".").pop() as keyof typeof TYPES;
  const file = fileURLToPath(new URL(`../public/${name}`, import.meta.url));
  // 画像はバイト列のまま返す（文字列にすると壊れる）
  const body = ext === "png" ? new Uint8Array(readFileSync(file)) : readFileSync(file, "utf8");
  return { body, type: TYPES[ext] };
}

export const STATIC_ASSETS: ReadonlyMap<string, StaticAsset> = new Map(FILES.map((name) => [name, load(name)]));
