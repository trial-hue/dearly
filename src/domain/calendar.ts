import { FEASTS, FIXED } from './constants';
import type { OccasionLike } from './types';

const DAY_MS = 86_400_000;

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const out = startOfDay(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function addYears(d: Date, n: number): Date {
  const out = startOfDay(d);
  out.setFullYear(out.getFullYear() + n);
  return out;
}

/** Whole calendar days from a to b. DST-safe because it compares UTC midnights of local dates. */
export function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / DAY_MS);
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function monthDayOf(d: Date): string {
  return isoDate(d).slice(5);
}

/** Parse 'YYYY-MM-DD' as a local date. Returns null when invalid. */
export function parseIsoDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const out = new Date(y, mo - 1, d);
  if (out.getFullYear() !== y || out.getMonth() !== mo - 1 || out.getDate() !== d) return null;
  return out;
}

/** Next occurrence of a 'MM-DD' on or after today. 29 February rolls to 28 February off leap years. */
export function nextOccurrence(monthDay: string, today: Date): Date {
  const [mStr, dStr] = monthDay.split('-');
  const month = Number(mStr) - 1;
  const day = Number(dStr);
  const build = (year: number): Date => {
    const candidate = new Date(year, month, day);
    if (candidate.getMonth() !== month) return new Date(year, month + 1, 0); // last day of month
    return candidate;
  };
  const t = startOfDay(today);
  const thisYear = build(t.getFullYear());
  return thisYear >= t ? thisYear : build(t.getFullYear() + 1);
}

type FeastKey = keyof typeof FEASTS;
type FixedKey = keyof typeof FIXED;

function isFeast(type: string): type is FeastKey {
  return Object.prototype.hasOwnProperty.call(FEASTS, type);
}
function isFixed(type: string): type is FixedKey {
  return Object.prototype.hasOwnProperty.call(FIXED, type);
}

/**
 * The next date an occasion falls on, on or after today:
 * an ad hoc date as given; a feast from the FEASTS table; a fixed date; or a month-day.
 * Returns null when nothing can be determined (a feast past its table, or no date at all).
 */
export function nextDate(
  occasion: Pick<OccasionLike, 'type' | 'monthDay' | 'adhocDate'>,
  today: Date,
): Date | null {
  const t = startOfDay(today);
  if (occasion.adhocDate) return parseIsoDate(occasion.adhocDate);
  if (isFeast(occasion.type)) {
    for (const iso of FEASTS[occasion.type]) {
      const d = parseIsoDate(iso);
      if (d && d >= t) return d;
    }
    return null;
  }
  if (isFixed(occasion.type)) return nextOccurrence(FIXED[occasion.type], t);
  if (occasion.monthDay) return nextOccurrence(occasion.monthDay, t);
  return null;
}

/** Age (or years since) at a given date for an occasion with a start year. */
export function yearsAt(startYear: number | null, at: Date): number | null {
  if (startYear == null) return null;
  return at.getFullYear() - startYear;
}

export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** Monday on or before the given day. */
export function startOfWeek(d: Date): Date {
  const t = startOfDay(d);
  const dow = (t.getDay() + 6) % 7; // Monday = 0
  return addDays(t, -dow);
}

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

export function monthIndex(name: string): number {
  const n = name.toLowerCase().slice(0, 3);
  return MONTHS.findIndex((m) => m.startsWith(n));
}

export interface FlexibleDate {
  year: number | null;
  month: number; // 1-12
  day: number;
}

/**
 * Parse the date formats people actually type, day before month for numeric forms:
 * dd/mm/yyyy, d/m/yy, yyyy-mm-dd, dd.mm.yyyy, d Mon yyyy, d Month, Month d, Month d yyyy.
 * Validates the calendar day (31/02 is rejected). Returns null when unparseable.
 */
export function parseFlexibleDate(input: string): FlexibleDate | null {
  const s = input
    .trim()
    .replace(/(\d)(st|nd|rd|th)\b/gi, '$1')
    .replace(/,/g, ' ');
  if (!s) return null;
  let year: number | null = null;
  let month = -1;
  let day = -1;
  let m: RegExpExecArray | null;
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s))) {
    year = Number(m[1]);
    month = Number(m[2]);
    day = Number(m[3]);
  } else if ((m = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/.exec(s))) {
    day = Number(m[1]);
    month = Number(m[2]);
    if (m[3]) year = expandYear(Number(m[3]), m[3].length);
  } else if ((m = /^(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{2,4}))?$/.exec(s))) {
    day = Number(m[1]);
    month = monthIndex(m[2]) + 1;
    if (m[3]) year = expandYear(Number(m[3]), m[3].length);
  } else if ((m = /^([A-Za-z]+)\s+(\d{1,2})(?:\s+(\d{2,4}))?$/.exec(s))) {
    month = monthIndex(m[1]) + 1;
    day = Number(m[2]);
    if (m[3]) year = expandYear(Number(m[3]), m[3].length);
  } else {
    return null;
  }
  if (month < 1 || month > 12 || day < 1) return null;
  const probeYear = year ?? 2024; // leap year so 29 February passes when no year is given
  const probe = new Date(probeYear, month - 1, day);
  if (probe.getMonth() !== month - 1 || probe.getDate() !== day) return null;
  return { year, month, day };
}

function expandYear(n: number, digits: number): number {
  if (digits === 4) return n;
  // Two-digit years: 00-30 are 2000s, the rest 1900s (dates of birth and start dates).
  return n <= 30 ? 2000 + n : 1900 + n;
}

export function monthDayFrom(f: FlexibleDate): string {
  return `${String(f.month).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`;
}

export function isoFrom(f: FlexibleDate & { year: number }): string {
  return `${f.year}-${monthDayFrom(f)}`;
}
