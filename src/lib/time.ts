// ---------------------------------------------------------------------
//  Pure time helpers. Times are handled as "HH:MM" strings and minutes
//  since midnight — no timezone math, which keeps room scheduling
//  predictable and matches how people actually book ("book 3–4pm").
// ---------------------------------------------------------------------

/** Office hours used when proposing alternative slots. */
export const OFFICE_START_MIN = 8 * 60; // 08:00
export const OFFICE_END_MIN = 20 * 60; // 20:00

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(t: string): boolean {
  return HHMM.test(t);
}

/** "HH:MM" -> minutes since midnight. Throws on malformed input. */
export function toMinutes(t: string): number {
  const m = HHMM.exec(t);
  if (!m) throw new Error(`Invalid time: ${t}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** minutes since midnight -> "HH:MM". */
export function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Normalise a "HH:MM:SS" (as Postgres TIME returns) down to "HH:MM". */
export function trimSeconds(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t;
}

/** Do [aStart,aEnd) and [bStart,bEnd) overlap? (half-open ranges) */
export function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Validate that a YYYY-MM-DD string is a real calendar date. */
export function isValidDate(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const dt = new Date(`${d}T00:00:00`);
  return !Number.isNaN(dt.getTime()) && dt.toISOString().slice(0, 10) === d;
}

/** Today's date as YYYY-MM-DD in the server's local time. */
export function todayISO(): string {
  const now = new Date();
  const tz = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tz).toISOString().slice(0, 10);
}

/** Current minute-of-day in local time. */
export function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// ---------------------------------------------------------------------
//  Prisma <-> app conversions.
//  Prisma has no first-class Date/Time type: it maps Postgres DATE and
//  TIME to JS `Date`, storing the value in the UTC components. We keep
//  the rest of the app working in plain "YYYY-MM-DD" / "HH:MM" strings
//  and convert only at the Prisma boundary.
// ---------------------------------------------------------------------

/** "HH:MM" -> Date usable for a Prisma @db.Time column. */
export function hhmmToPgTime(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, h, m, 0));
}

/** Prisma @db.Time Date -> "HH:MM". */
export function pgTimeToHHMM(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
    d.getUTCMinutes(),
  ).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" -> Date usable for a Prisma @db.Date column. */
export function isoToPgDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Prisma @db.Date Date -> "YYYY-MM-DD". */
export function pgDateToISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
