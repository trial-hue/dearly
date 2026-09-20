import { describe, expect, it } from 'vitest';

import {
  annualCalculator,
  businessUnitPricePence,
  cleanStaffList,
  priceBatch,
  schedulable,
  seedStaffText,
  sendDateFor,
  staffRowsSummary,
} from '../business';

const today = new Date(2026, 8, 20);

describe('staff list clean-up', () => {
  const rows = cleanStaffList(seedStaffText(today));
  it('schedules 7 rows and flags 3 from the seeded messy list', () => {
    expect(rows).toHaveLength(10);
    expect(staffRowsSummary(rows, 'posted')).toEqual({ scheduled: 7, flagged: 3 });
    expect(rows[2]!.issue).toBe('missing postcode');
    expect(rows[4]!.issue).toBe('duplicate of row 1');
    expect(rows[7]!.issue).toContain('invalid date');
    expect(rows[9]!.year).toBe(1987);
    expect(rows[6]!.year).toBeNull();
  });
  it('lets a missing postcode through for an office drop', () => {
    expect(schedulable(rows[2]!, 'officeDrop')).toBe(true);
    expect(schedulable(rows[2]!, 'posted')).toBe(false);
    expect(staffRowsSummary(rows, 'officeDrop').scheduled).toBe(8);
  });
  it('computes send dates from the next occurrence minus the lead time', () => {
    expect(sendDateFor(rows[8]!, 'posted', today)).toEqual(today); // leaver tomorrow: cannot post three days early
    expect(sendDateFor(rows[1]!, 'posted', today)).toEqual(new Date(2026, 9, 30)); // 2 November minus 3
    expect(sendDateFor(rows[1]!, 'officeDrop', today)).toEqual(new Date(2026, 10, 1));
  });
});

describe('business pricing', () => {
  it('tiers posted cards by annual volume and keeps office drop flat', () => {
    expect(businessUnitPricePence(100, 'posted')).toBe(330);
    expect(businessUnitPricePence(250, 'posted')).toBe(310);
    expect(businessUnitPricePence(2000, 'posted')).toBe(280);
    expect(businessUnitPricePence(5000, 'officeDrop')).toBe(230);
  });
  it('prices a batch with a positive contribution', () => {
    const b = priceBatch(7, {
      option: 'posted',
      finish: 'signature',
      annualCards: 7,
      automate: false,
    });
    expect(b.totalPence).toBe(7 * 330);
    expect(b.contributionPence).toBeGreaterThan(0);
    expect(b.contributionPence).toBeLessThan(b.totalPence);
    const withGiant = priceBatch(7, {
      option: 'posted',
      finish: 'signature',
      annualCards: 7,
      automate: false,
      giantCards: 1,
    });
    expect(withGiant.totalPence).toBe(6 * 330 + withGiant.giantUnitPence);
    const automated = priceBatch(30, {
      option: 'posted',
      finish: 'classic',
      annualCards: 300,
      automate: true,
    });
    expect(automated.freeCards).toBe(25);
    expect(automated.totalPence).toBe(5 * 310);
  });
  it('compares a year against Moonpig at £3.60 a card', () => {
    const r = annualCalculator({ cardsPerYear: 400, postedShare: 0.7, automate: false });
    expect(r.moonpigPence).toBe(400 * 360);
    expect(r.dearlyPence).toBe(280 * 310 + 120 * 230);
    expect(r.savingPence).toBe(r.moonpigPence - r.dearlyPence);
    const auto = annualCalculator({ cardsPerYear: 400, postedShare: 0.7, automate: true });
    expect(auto.includedCards).toBe(25); // the first 25 cards are free, once
    expect(auto.subscriptionPence).toBe(58_800);
  });
});
