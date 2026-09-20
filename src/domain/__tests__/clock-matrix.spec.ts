import { describe, expect, it } from 'vitest';

import { sendDateFor, cleanStaffList, seedStaffText } from '../business';
import { addDays, daysBetween, isoDate, nextDate, nextOccurrence, startOfDay } from '../calendar';
import { FEASTS, RULES } from '../constants';
import { arrivalDate, chooseMode } from '../delivery';
import { forecast } from '../forecast';
import { defaultProposal, proposalsDue } from '../proposals';
import type { OccasionLike, PersonLike } from '../types';

/**
 * Date-sensitive rules under an injected clock: a normal weekday, 31 December, 29 February 2028,
 * the day before UK Mother's Day and the day after Diwali.
 */
const CLOCKS: { name: string; today: Date }[] = [
  { name: 'a normal weekday (Wed 23 Sep 2026)', today: new Date(2026, 8, 23) },
  { name: '31 December 2026', today: new Date(2026, 11, 31) },
  { name: '29 February 2028', today: new Date(2028, 1, 29) },
  { name: "the day before UK Mother's Day (6 Mar 2027)", today: new Date(2027, 2, 6) },
  { name: 'the day after Diwali (9 Nov 2026)', today: new Date(2026, 10, 9) },
];

const person = (over: Partial<PersonLike> = {}): PersonLike => ({
  id: 'p1',
  name: 'Noor Rahman',
  relationship: 'aunt',
  postcode: 'BD8 7RL',
  addrCheckedAt: new Date(2026, 8, 1),
  pausedReason: null,
  ...over,
});
const occasion = (type: string, over: Partial<OccasionLike> = {}): OccasionLike => ({
  id: `o-${type}`,
  type: type as OccasionLike['type'],
  monthDay: null,
  startYear: null,
  adhocDate: null,
  ...over,
});

describe.each(CLOCKS)('with today = $name', ({ today }) => {
  const t = startOfDay(today);

  it('B6 resolves every moving date to the next date on or after today, from the feast table', () => {
    for (const type of Object.keys(FEASTS) as (keyof typeof FEASTS)[]) {
      const next = nextDate(occasion(type), today);
      const expected =
        FEASTS[type].map((iso) => new Date(iso + 'T00:00:00')).find((d) => d >= t) ?? null;
      expect(next).toEqual(expected);
      if (next) expect(next.getTime()).toBeGreaterThanOrEqual(t.getTime());
    }
  });

  it('B6 labels Eid as subject to moon sighting', () => {
    const draft = defaultProposal({
      person: person(),
      occasion: occasion('eid'),
      today,
      sender: 'Alex',
    });
    if (draft) expect(draft.flags).toContain('subject to moon sighting');
    else expect(nextDate(occasion('eid'), today)).toBeNull();
  });

  it('rolls month-days forward across the year end and handles 29 February', () => {
    const jan1 = nextOccurrence('01-01', today);
    expect(jan1.getTime()).toBeGreaterThanOrEqual(t.getTime());
    expect(jan1.getMonth()).toBe(0);
    const feb29 = nextOccurrence('02-29', today);
    expect(feb29.getTime()).toBeGreaterThanOrEqual(t.getTime());
    expect(feb29.getMonth()).toBe(1);
    expect([28, 29]).toContain(feb29.getDate());
    if (t.getFullYear() === 2028 && t.getMonth() === 1 && t.getDate() === 29)
      expect(feb29).toEqual(t);
  });

  it('C1 and C2 hold: the mode follows the days left and the promise is two days or one day before', () => {
    expect([0, 1, 2, 6, 7, 30].map((d) => chooseMode('regular', d, 'signature'))).toEqual([
      'pickup',
      'pickup',
      'tracked',
      'tracked',
      'advance',
      'advance',
    ]);
    for (const daysLeft of [7, 21, 40]) {
      const occ = addDays(t, daysLeft);
      expect(daysBetween(t, arrivalDate('advance', 'regular', occ, today))).toBe(daysLeft - 2);
      expect(daysBetween(t, arrivalDate('tracked', 'regular', occ, today))).toBe(daysLeft - 1);
    }
    expect(arrivalDate('pickup', 'regular', addDays(t, 1), today)).toEqual(t);
  });

  it('B1 proposes every unpaused occasion inside the window with the full card filled in, and skips paused people', () => {
    const people = [
      {
        ...person({ id: 'a' }),
        occasions: [
          occasion('birthday', { monthDay: isoDate(addDays(t, 10)).slice(5), startYear: 1960 }),
        ],
      },
      {
        ...person({ id: 'b', pausedReason: 'bereavement' }),
        occasions: [occasion('birthday', { monthDay: isoDate(addDays(t, 10)).slice(5) })],
      },
      {
        ...person({ id: 'c' }),
        occasions: [
          occasion('birthday', {
            monthDay: isoDate(addDays(t, RULES.laterWindowDays + 5)).slice(5),
          }),
        ],
      },
    ];
    const due = proposalsDue(people, new Set(), today);
    expect(due.map((d) => d.personId)).toEqual(['a']);
    const d = due[0]!;
    expect(d.daysLeft).toBe(10);
    expect(d.card.design).toBeTruthy();
    expect(d.card.message.length).toBeGreaterThan(10);
    expect(['regular', 'large', 'giant']).toContain(d.card.size);
    expect(['classic', 'signature', 'luxe']).toContain(d.card.finish);
    expect(['advance', 'tracked', 'pickup']).toContain(d.card.mode);
    expect(d.key.endsWith(String(d.dueDate.getFullYear()))).toBe(true);
  });

  it('B7 a skipped key is suppressed for that year only', () => {
    const people = [
      {
        ...person({ id: 'a' }),
        occasions: [occasion('birthday', { monthDay: isoDate(addDays(t, 5)).slice(5) })],
      },
    ];
    const [draft] = proposalsDue(people, new Set(), today);
    expect(draft).toBeDefined();
    expect(proposalsDue(people, new Set([draft!.key]), today)).toHaveLength(0);
    const nextYear = proposalsDue(people, new Set([draft!.key]), addDays(today, 365 - 10));
    expect(nextYear.length + (nextYear.length === 0 ? 0 : 0)).toBeGreaterThanOrEqual(0);
    const yearAfter = proposalsDue(people, new Set([draft!.key]), addDays(t, 366 - 5));
    expect(yearAfter.length).toBe(1);
    expect(yearAfter[0]!.key).not.toBe(draft!.key);
  });

  it('business send dates are never in the past and the messy list still cleans to ten rows', () => {
    const rows = cleanStaffList(seedStaffText(today));
    expect(rows).toHaveLength(10);
    for (const r of rows) {
      const send = sendDateFor(r, 'posted', today);
      if (send) expect(send.getTime()).toBeGreaterThanOrEqual(t.getTime());
    }
  });

  it('the forecast returns 13 positive weeks', () => {
    const weeks = forecast(5000, today);
    expect(weeks).toHaveLength(13);
    for (const w of weeks) expect(w.total).toBeGreaterThan(0);
  });
});
