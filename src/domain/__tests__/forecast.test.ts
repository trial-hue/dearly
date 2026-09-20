import { describe, expect, it } from 'vitest';

import { DEFAULT_COSTS } from '../constants';
import { blendedContributionPence, economics } from '../economics';
import { forecast, weekMultiplier } from '../forecast';

describe('forecast', () => {
  it('returns 13 weeks whose mode splits sum to the weekly total', () => {
    const weeks = forecast(5000, new Date(2026, 8, 20));
    expect(weeks).toHaveLength(13);
    for (const w of weeks) expect(w.advance + w.tracked + w.pickup).toBe(w.total);
    expect(weeks.some((w) => w.peak === 'Christmas ordering')).toBe(true);
  });
  it('applies the peak multipliers for any start date', () => {
    expect(weekMultiplier(new Date(2026, 10, 30)).multiplier).toBe(2.6);
    expect(weekMultiplier(new Date(2027, 1, 8)).multiplier).toBe(1.8);
    expect(weekMultiplier(new Date(2027, 2, 1)).multiplier).toBe(2.4); // week before Mothering Sunday 7 March 2027
    expect(weekMultiplier(new Date(2026, 8, 14))).toEqual({ multiplier: 1, peak: null });
  });
});

describe('economics', () => {
  it('blends 20/60/20 by finish to 2.07 and breaks even at 159,107 orders', () => {
    expect(blendedContributionPence()).toBe(207);
    const e = economics();
    expect(e.breakEvenOrders).toBe(159_107);
    expect(e.breakEvenCustomers).toBe(Math.ceil(e.breakEvenOrders / 4));
    expect(e.teamCostPerOrderPence(400_000)).toBe(83);
    expect(e.teamCostPerOrderPence(210_000)).toBe(157);
  });
  it('lowers break-even when the team costs less', () => {
    const cheaper = economics({ ...DEFAULT_COSTS, teamPerYear: 200_000 });
    expect(cheaper.breakEvenOrders).toBeLessThan(economics().breakEvenOrders);
  });
});
