// Month-granular values are stored DB-wide as a single YYYYMM integer (e.g. April 2024 -> 202404).
// The API wire format stays the human-readable `YYYY-MM` string; these helpers are the single
// source of truth for converting between the two at the repository/service boundary.

/** April 2024 (202404) -> '2024-04'. */
export function yyyymmToString(n: number): string {
  const year = Math.trunc(n / 100);
  const month = n % 100;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

/** '2024-04' or '2024-04-15' -> 202404. Throws on malformed input. */
export function stringToYyyymm(s: string): number {
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(s);
  if (!match) {
    throw new Error(`Invalid year-month string: ${s}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month in year-month string: ${s}`);
  }
  return year * 100 + month;
}

/** True when `n` is a well-formed YYYYMM int (plausible year + month 1..12). */
export function isValidYyyymm(n: number): boolean {
  return Number.isInteger(n) && n >= 190001 && n <= 999912 && n % 100 >= 1 && n % 100 <= 12;
}
