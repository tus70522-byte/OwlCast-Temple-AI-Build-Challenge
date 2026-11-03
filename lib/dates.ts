/**
 * Calendar-date helpers. Every date in OwlCast is a `YYYY-MM-DD` string that means a
 * calendar day in America/New_York. All arithmetic happens on UTC-pinned dates
 * (TZDate in "UTC"), so the machine's local time zone can never shift a day.
 */
import { TZDate } from "@date-fns/tz";
import { addDays as dfAddDays, differenceInCalendarDays, format } from "date-fns";

export type ISODate = string;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type DayOfWeek = (typeof DAY_NAMES)[number];

export function isValidISODate(value: unknown): value is ISODate {
  if (typeof value !== "string") return false;
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** Parse an ISO calendar date into a UTC-pinned Date (midnight UTC). */
export function toDate(iso: ISODate): TZDate {
  if (!isValidISODate(iso)) throw new Error(`Invalid calendar date: ${iso}`);
  const [y, m, d] = iso.split("-").map(Number);
  return new TZDate(y, m - 1, d, "UTC");
}

export function toISO(date: Date): ISODate {
  const d = date instanceof TZDate && date.timeZone === "UTC" ? date : new TZDate(date, "UTC");
  return format(d, "yyyy-MM-dd");
}

export function addDays(iso: ISODate, days: number): ISODate {
  return toISO(dfAddDays(toDate(iso), days));
}

/** b - a in whole calendar days. */
export function diffDays(a: ISODate, b: ISODate): number {
  return differenceInCalendarDays(toDate(b), toDate(a));
}

/** 0 = Monday … 6 = Sunday */
export function weekdayIndex(iso: ISODate): number {
  return (toDate(iso).getDay() + 6) % 7;
}

export function dayOfWeek(iso: ISODate): DayOfWeek {
  return DAY_NAMES[weekdayIndex(iso)];
}

export function mondayOf(iso: ISODate): ISODate {
  return addDays(iso, -weekdayIndex(iso));
}

export function isBetween(iso: ISODate, start: ISODate, end: ISODate): boolean {
  return iso >= start && iso <= end;
}

export function eachDay(start: ISODate, end: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

/** e.g. "Thu, Feb 25" */
export function formatShort(iso: ISODate): string {
  return format(toDate(iso), "EEE, MMM d");
}
/** e.g. "Feb 25" */
export function formatMonthDay(iso: ISODate): string {
  return format(toDate(iso), "MMM d");
}
/** e.g. "Thursday, February 25, 2027" */
export function formatLong(iso: ISODate): string {
  return format(toDate(iso), "EEEE, MMMM d, yyyy");
}
/** e.g. "Feb 22–28" or "Apr 26–May 2" */
export function formatRange(start: ISODate, end: ISODate): string {
  const s = toDate(start);
  const e = toDate(end);
  if (start === end) return format(s, "MMM d");
  if (s.getMonth() === e.getMonth()) return `${format(s, "MMM d")}–${format(e, "d")}`;
  return `${format(s, "MMM d")}–${format(e, "MMM d")}`;
}

/** Today's calendar date in America/New_York. */
export function todayISO(now: Date = new Date()): ISODate {
  return format(new TZDate(now, "America/New_York"), "yyyy-MM-dd");
}

export function toIcsDateArray(iso: ISODate): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}
