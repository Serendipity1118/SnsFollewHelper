import { parse } from "csv-parse/sync";
import type { CsvRow } from "../domain/buildQueue";

export class CsvFormatError extends Error {}

/** UTF-8（BOM可）のCSVをヘッダー付きで読む。Pythonの csv.DictReader と同様に列数の揺れは許容する。 */
export function parseCsv(text: string): CsvRow[] {
  try {
    return parse(text, {
      bom: true,
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      // 元データは CRLF と LF が混在する。自動判定だと途中の LF がフィールド内扱いになり行が結合される
      record_delimiter: ["\r\n", "\n", "\r"],
    }) as CsvRow[];
  } catch (error) {
    throw new CsvFormatError(`CSVを読めませんでした: ${(error as Error).message}`);
  }
}

/** 必須列があるかを確認する。無ければ CsvFormatError。 */
export function requireColumns(rows: readonly CsvRow[], text: string, columns: readonly string[]): void {
  const header = rows[0] ? Object.keys(rows[0]) : headerOf(text);
  const missing = columns.filter((c) => !header.includes(c));
  if (missing.length) {
    throw new CsvFormatError(`列 ${missing.join(", ")} が見つかりません`);
  }
}

function headerOf(text: string): string[] {
  const firstLine = text.replace(/^﻿/, "").split(/\r?\n/, 1)[0] ?? "";
  return firstLine.split(",").map((c) => c.trim());
}
