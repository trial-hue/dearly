import { describe, expect, it } from 'vitest';

import {
  allowedModes,
  arrivalDate,
  chooseMode,
  isLate,
  isTerminal,
  nextStage,
  offerEcardAlongside,
} from '../delivery';

describe('chooseMode', () => {
  it('always tracks Giant cards', () => {
    for (const n of [0, 1, 2, 6, 7, 30, 120]) expect(chooseMode('giant', n)).toBe('tracked');
  });
  it('tracks a Large card with one day left', () => {
    expect(chooseMode('large', 1)).toBe('tracked');
  });
  it('follows the day thresholds for Regular cards', () => {
    expect([0, 1, 2, 6, 7, 30].map((d) => chooseMode('regular', d))).toEqual([
      'pickup',
      'pickup',
      'tracked',
      'tracked',
      'advance',
      'advance',
    ]);
  });
});

describe('allowedModes', () => {
  it('allows tracked only for Giant and pick-up only for Regular', () => {
    expect(allowedModes('giant')).toEqual(['tracked']);
    expect(allowedModes('regular')).toEqual(['advance', 'tracked', 'pickup']);
    expect(allowedModes('large')).toEqual(['advance', 'tracked']);
  });
});

describe('arrivalDate and stages', () => {
  const today = new Date(2026, 8, 20);
  it('shows arrival per the delivery rule', () => {
    const occ = new Date(2026, 9, 9);
    expect(arrivalDate('advance', 'regular', occ, today)).toEqual(new Date(2026, 9, 7));
    expect(arrivalDate('tracked', 'regular', occ, today)).toEqual(new Date(2026, 9, 8));
    expect(arrivalDate('tracked', 'giant', new Date(2026, 8, 21), today)).toEqual(
      new Date(2026, 8, 21),
    );
    expect(arrivalDate('pickup', 'regular', occ, today)).toEqual(today);
    expect(arrivalDate('ecard', 'regular', occ, today)).toEqual(today);
  });
  it('offers an eCard alongside a large card with under two days', () => {
    expect(offerEcardAlongside('large', 1)).toBe(true);
    expect(offerEcardAlongside('regular', 1)).toBe(false);
  });
  it('walks the stage ladder for each mode', () => {
    expect(nextStage({ mode: 'advance', stage: 'checked' })).toBe('routed');
    expect(nextStage({ mode: 'advance', stage: 'posted' })).toBe('delivered');
    expect(nextStage({ mode: 'advance', stage: 'delivered' })).toBeNull();
    expect(nextStage({ mode: 'pickup', stage: 'printed' })).toBe('ready_for_pickup');
    expect(nextStage({ mode: 'ecard', stage: 'delivered' })).toBeNull();
    expect(isTerminal('collected')).toBe(true);
  });
  it('knows when an order is late', () => {
    expect(isLate({ stage: 'posted', promisedDate: new Date(2026, 8, 18) }, today)).toBe(true);
    expect(isLate({ stage: 'posted', promisedDate: new Date(2026, 8, 22) }, today)).toBe(false);
    expect(isLate({ stage: 'delivered', promisedDate: new Date(2026, 8, 1) }, today)).toBe(false);
    expect(
      isLate({ stage: 'posted', promisedDate: new Date(2026, 8, 25), delayed: true }, today),
    ).toBe(true);
  });
});
