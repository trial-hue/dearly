import { describe, expect, it } from 'vitest';

import {
  daysBetween,
  nextDate,
  nextOccurrence,
  ordinal,
  parseFlexibleDate,
  startOfWeek,
} from '../calendar';
import { FEASTS, FIXED } from '../constants';

describe('nextDate', () => {
  const todays = [
    new Date(2026, 8, 20),
    new Date(2026, 11, 31),
    new Date(2028, 1, 29),
    new Date(2027, 0, 1),
  ];
  it('returns today or later for every feast and fixed occasion', () => {
    for (const today of todays) {
      for (const type of Object.keys(FEASTS) as (keyof typeof FEASTS)[]) {
        const d = nextDate({ type, monthDay: null, adhocDate: null }, today);
        expect(d, `${type} on ${today.toDateString()}`).not.toBeNull();
        expect(daysBetween(today, d!)).toBeGreaterThanOrEqual(0);
      }
      for (const type of Object.keys(FIXED) as (keyof typeof FIXED)[]) {
        const d = nextDate({ type, monthDay: null, adhocDate: null }, today);
        expect(daysBetween(today, d!)).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it('uses the ad hoc date when given and rolls a month-day forward', () => {
    expect(
      nextDate({ type: 'leaving', monthDay: null, adhocDate: '2026-09-21' }, new Date(2026, 8, 20)),
    ).toEqual(new Date(2026, 8, 21));
    expect(
      nextDate({ type: 'birthday', monthDay: '01-05', adhocDate: null }, new Date(2026, 8, 20)),
    ).toEqual(new Date(2027, 0, 5));
    expect(nextOccurrence('02-29', new Date(2026, 2, 1))).toEqual(new Date(2027, 1, 28));
    expect(nextOccurrence('02-29', new Date(2028, 0, 1))).toEqual(new Date(2028, 1, 29));
  });
  it('returns null past the end of a feast table', () => {
    expect(
      nextDate({ type: 'eid', monthDay: null, adhocDate: null }, new Date(2031, 0, 1)),
    ).toBeNull();
  });
});

describe('helpers', () => {
  it('counts calendar days across DST', () => {
    expect(daysBetween(new Date(2026, 2, 28), new Date(2026, 2, 30))).toBe(2);
    expect(daysBetween(new Date(2026, 9, 24), new Date(2026, 9, 26))).toBe(2);
  });
  it('formats ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 60, 88, 101].map(ordinal)).toEqual([
      '1st',
      '2nd',
      '3rd',
      '4th',
      '11th',
      '12th',
      '13th',
      '21st',
      '60th',
      '88th',
      '101st',
    ]);
  });
  it('starts weeks on Monday', () => {
    expect(startOfWeek(new Date(2026, 8, 20))).toEqual(new Date(2026, 8, 14)); // Sunday -> previous Monday
    expect(startOfWeek(new Date(2026, 8, 14))).toEqual(new Date(2026, 8, 14));
  });
});

describe('parseFlexibleDate', () => {
  it('accepts the formats people type, day first', () => {
    expect(parseFlexibleDate('14/03/1991')).toEqual({ year: 1991, month: 3, day: 14 });
    expect(parseFlexibleDate('1988-11-02')).toEqual({ year: 1988, month: 11, day: 2 });
    expect(parseFlexibleDate('7 Aug 1995')).toEqual({ year: 1995, month: 8, day: 7 });
    expect(parseFlexibleDate('02.11.1990')).toEqual({ year: 1990, month: 11, day: 2 });
    expect(parseFlexibleDate('March 30')).toEqual({ year: null, month: 3, day: 30 });
    expect(parseFlexibleDate('5/6/87')).toEqual({ year: 1987, month: 6, day: 5 });
    expect(parseFlexibleDate('14 March')).toEqual({ year: null, month: 3, day: 14 });
    expect(parseFlexibleDate('2nd Feb 1941')).toEqual({ year: 1941, month: 2, day: 2 });
  });
  it('rejects impossible dates and noise', () => {
    expect(parseFlexibleDate('31/02/1993')).toBeNull();
    expect(parseFlexibleDate('13/13/2000')).toBeNull();
    expect(parseFlexibleDate('soon')).toBeNull();
    expect(parseFlexibleDate('')).toBeNull();
  });
});
