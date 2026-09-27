const DAY_MS = 86_400_000;
const UPDATE_DATE_RE = /^(\d{4})([/.-])(\d{1,2})\2(\d{1,2})$/;

/**
 * queue_lib.parse_update_date の移植。"%Y/%m/%d" "%Y-%m-%d" "%Y.%m.%d" を受け付け、
 * 比較用の通し日数を返す（Pythonの toordinal と同じく1日で1増える）。解釈できなければ null。
 */
export function parseUpdateDate(raw: string | null | undefined): number | null {
  const match = UPDATE_DATE_RE.exec((raw ?? "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[3]);
  const day = Number(match[4]);
  const stamp = Date.UTC(year, month - 1, day);
  const check = new Date(stamp);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return stamp / DAY_MS;
}

/** ローカル時刻の YYYY-MM-DD（Pythonの date.today().isoformat() 相当）。 */
export function localIsoDate(at: Date): string {
  const y = at.getFullYear();
  const m = String(at.getMonth() + 1).padStart(2, "0");
  const d = String(at.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** ローカル日付の0時（epoch ms）。 */
export function startOfLocalDay(at: Date): number {
  return new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime();
}
