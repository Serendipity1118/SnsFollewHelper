const NEEDS_QUOTE = /[",\r\n]/;

function escapeField(value: string): string {
  return NEEDS_QUOTE.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** Pythonの csv.DictWriter（utf-8-sig, CRLF）と同じ形のCSVを作る。 */
export function toCsv(columns: readonly string[], records: ReadonlyArray<Record<string, string>>): string {
  const rows = [columns, ...records.map((r) => columns.map((c) => r[c] ?? ""))];
  return "﻿" + rows.map((row) => row.map(escapeField).join(",")).join("\r\n") + "\r\n";
}
