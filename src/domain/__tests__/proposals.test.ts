import { describe, expect, it } from 'vitest';

import { addDays, monthDayOf } from '../calendar';
import { RULES } from '../constants';
import { bucketFor, canApprove, defaultProposal, proposalsDue } from '../proposals';
import type { PersonWithOccasions } from '../proposals';

const today = new Date(2026, 8, 20);
const person = (
  over: Partial<PersonWithOccasions> & { id: string; name: string; relationship: string },
): PersonWithOccasions => ({
  postcode: 'M20 2RN',
  addrCheckedAt: addDays(today, -30),
  pausedReason: null,
  occasions: [],
  ...over,
});
const birthdayIn = (days: number, age: number | null) => {
  const d = addDays(today, days);
  return {
    id: `occ-${days}`,
    type: 'birthday' as const,
    monthDay: monthDayOf(d),
    startYear: age == null ? null : d.getFullYear() - age,
    adhocDate: null,
  };
};

describe('defaultProposal', () => {
  it('suggests Large Luxe with flowers for a mother turning 60 and a big number design', () => {
    const p = defaultProposal({
      person: person({ id: 'm', name: 'Margaret Ellis', relationship: 'mother', occasions: [] }),
      occasion: birthdayIn(19, 60),
      today,
      sender: 'Alex',
    });
    expect(p?.card).toMatchObject({
      design: 'bignumber',
      size: 'large',
      finish: 'luxe',
      gift: 'flowers',
      mode: 'advance',
    });
    expect(p?.flags).toContain('milestone');
    expect(p?.card.message).toContain('60th');
    expect(p?.card.message).toContain('Love, Alex');
  });
  it('gives colleagues Regular Classic and offers a Giant group card for a leaver', () => {
    const occ = {
      id: 'l',
      type: 'leaving' as const,
      monthDay: null,
      startYear: null,
      adhocDate: '2026-09-21',
    };
    const p = defaultProposal({
      person: person({ id: 's', name: 'Sam Whitlock', relationship: 'colleague' }),
      occasion: occ,
      today,
      sender: 'Alex',
    });
    expect(p?.card).toMatchObject({
      size: 'regular',
      finish: 'classic',
      mode: 'pickup',
      offerGiant: true,
    });
    expect(p?.flags).toContain('urgent');
    expect(p?.card.message).toContain('Best wishes, Alex');
  });
  it('tracks an 88th birthday three days away', () => {
    const p = defaultProposal({
      person: person({ id: 'b', name: 'Bill Ellis', relationship: 'grandfather' }),
      occasion: birthdayIn(3, 88),
      today,
      sender: 'Alex',
    });
    expect(p?.card.mode).toBe('tracked');
    expect(p?.card.size).toBe('regular');
  });
  it('flags a stale address and community occasions', () => {
    const p = defaultProposal({
      person: person({
        id: 'n',
        name: 'Noor Rahman',
        relationship: 'aunt',
        addrCheckedAt: addDays(today, -400),
      }),
      occasion: { id: 'e', type: 'eid', monthDay: null, startYear: null, adhocDate: null },
      today,
      sender: 'Alex',
    });
    expect(p?.flags).toEqual(
      expect.arrayContaining([
        'subject to moon sighting',
        'community range',
        'address needs confirming',
      ]),
    );
  });
});

describe('proposalsDue and canApprove', () => {
  it('returns nothing for a paused person and skips existing keys', () => {
    const peter = person({
      id: 'peter',
      name: 'Peter Ellis',
      relationship: 'uncle',
      pausedReason: 'Bereavement',
      occasions: [birthdayIn(12, 70)],
    });
    const dan = person({
      id: 'dan',
      name: 'Dan Okafor',
      relationship: 'friend',
      occasions: [birthdayIn(9, 34)],
    });
    const due = proposalsDue([peter, dan], new Set(), today);
    expect(due.map((d) => d.personId)).toEqual(['dan']);
    expect(proposalsDue([dan], new Set(due.map((d) => d.key)), today)).toHaveLength(0);
  });
  it('keeps occasions inside the Later window only', () => {
    const far = person({
      id: 'f',
      name: 'Far Away',
      relationship: 'friend',
      occasions: [birthdayIn(200, 40), birthdayIn(140, 41)],
    });
    const due = proposalsDue([far], new Set(), today);
    expect(due).toHaveLength(1);
    expect(due[0]!.daysLeft).toBe(140);
  });
  it('blocks approval after 365 days without an address check, except for eCards', () => {
    const stale = { addrCheckedAt: addDays(today, -(RULES.addressStaleDays + 1)) };
    expect(canApprove(stale, today)).toEqual({ ok: false, reason: 'address_stale' });
    expect(canApprove({ addrCheckedAt: addDays(today, -365) }, today)).toEqual({ ok: true });
    expect(canApprove({ addrCheckedAt: null }, today)).toEqual({
      ok: false,
      reason: 'address_stale',
    });
    expect(canApprove(stale, today, 'ecard')).toEqual({ ok: true });
  });
  it('buckets by days left', () => {
    expect([-1, 0, 35, 36, 150, 151].map(bucketFor)).toEqual([
      'past',
      'today',
      'today',
      'later',
      'later',
      'beyond',
    ]);
  });
});
