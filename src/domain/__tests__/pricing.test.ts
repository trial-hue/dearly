import { describe, expect, it } from 'vitest';

import { DEFAULT_COSTS } from '../constants';
import { contributionTable, quote } from '../pricing';

describe('quote', () => {
  it('prices a Regular Signature card by advance post at £4.94 against Moonpig £5.89', () => {
    const q = quote({ size: 'regular', finish: 'signature', mode: 'advance' });
    expect(q.totalPence).toBe(494);
    expect(q.moonpigPence).toBe(589);
    expect(q.savingPence).toBe(95);
    expect(q.guarantee).toBe(true);
  });

  it('adds the digital copy for 29p', () => {
    expect(
      quote({ size: 'regular', finish: 'signature', mode: 'advance', digital: true }).totalPence,
    ).toBe(523);
  });

  it('prices an eCard-only card at 79p with a positive contribution', () => {
    const q = quote({ size: 'regular', finish: 'signature', mode: 'ecard' });
    expect(q.totalPence).toBe(79);
    expect(q.moonpigPence).toBeNull();
    expect(q.contributionPence).toBeGreaterThan(0);
  });

  it('gives Regular contributions of about £1.24, £1.93 and £3.33 by advance post', () => {
    const c = (finish: 'classic' | 'signature' | 'luxe') =>
      quote({ size: 'regular', finish, mode: 'advance' }).contributionPence;
    expect(Math.abs(c('classic') - 124)).toBeLessThanOrEqual(3);
    expect(Math.abs(c('signature') - 193)).toBeLessThanOrEqual(3);
    expect(Math.abs(c('luxe') - 333)).toBeLessThanOrEqual(3);
  });

  it('has nine positive contributions rising with finish', () => {
    const table = contributionTable(DEFAULT_COSTS);
    expect(table).toHaveLength(9);
    for (const row of table) expect(row.contributionPence).toBeGreaterThan(0);
    for (const size of ['regular', 'large', 'giant'] as const) {
      const rows = table.filter((r) => r.size === size);
      expect(rows.map((r) => r.finish)).toEqual(['classic', 'signature', 'luxe']);
      expect(rows[0]!.contributionPence).toBeLessThan(rows[1]!.contributionPence);
      expect(rows[1]!.contributionPence).toBeLessThan(rows[2]!.contributionPence);
      expect(rows[0]!.mode).toBe(size === 'giant' ? 'tracked' : 'advance');
    }
  });

  it('compares with Moonpig only for printed Regular cards and notes pick-up', () => {
    expect(quote({ size: 'large', finish: 'classic', mode: 'advance' }).moonpigPence).toBeNull();
    const pickup = quote({ size: 'regular', finish: 'classic', mode: 'pickup' });
    expect(pickup.moonpigPence).toBeNull();
    expect(pickup.moonpigNote).toBe('Moonpig has no same-day physical card.');
    expect(quote({ size: 'regular', finish: 'classic', mode: 'tracked' }).moonpigPence).toBe(678);
  });

  it('includes gifts at price with a 62% cost share', () => {
    const q = quote({ size: 'large', finish: 'luxe', mode: 'advance', gift: 'flowers' });
    expect(q.totalPence).toBe(899 + 195 + 2400);
    expect(q.costs.giftPence).toBe(Math.round((2400 / 1.2) * 0.62));
  });

  it('rejects a delivery mode the size cannot use', () => {
    expect(() => quote({ size: 'giant', finish: 'classic', mode: 'advance' })).toThrow();
  });
});
