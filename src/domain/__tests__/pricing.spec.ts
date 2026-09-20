import { describe, expect, it } from 'vitest';

import {
  annualCalculator,
  businessUnitContributionPence,
  businessUnitPricePence,
  priceBatch,
} from '../business';
import { DEFAULT_COSTS, FINISHES, SIZES } from '../constants';
import { allowedModes } from '../delivery';
import { economics } from '../economics';
import { expectedCommissionPence } from '../florist';
import { quote, type QuoteInput } from '../pricing';
import type { Finish, Size } from '../types';

/** Canonical expected values. Totals are exact; contributions allow 1p. */
const CASES: {
  name: string;
  input: QuoteInput;
  total: number;
  exVat: number;
  contribution: number;
  moonpig: number | null;
  saving: number | null;
}[] = [
  {
    name: 'Regular Classic, advance',
    input: { size: 'regular', finish: 'classic', mode: 'advance' },
    total: 394,
    exVat: 328,
    contribution: 124,
    moonpig: 589,
    saving: 195,
  },
  {
    name: 'Regular Signature, advance',
    input: { size: 'regular', finish: 'signature', mode: 'advance' },
    total: 494,
    exVat: 412,
    contribution: 193,
    moonpig: 589,
    saving: 95,
  },
  {
    name: 'Regular Luxe, advance',
    input: { size: 'regular', finish: 'luxe', mode: 'advance' },
    total: 744,
    exVat: 620,
    contribution: 333,
    moonpig: 589,
    saving: -155,
  },
  {
    name: 'Regular Signature, tracked',
    input: { size: 'regular', finish: 'signature', mode: 'tracked' },
    total: 674,
    exVat: 562,
    contribution: 199,
    moonpig: 678,
    saving: 4,
  },
  {
    name: 'Regular Signature, pick-up',
    input: { size: 'regular', finish: 'signature', mode: 'pickup' },
    total: 594,
    exVat: 495,
    contribution: 253,
    moonpig: null,
    saving: null,
  },
  {
    name: 'Regular Classic, pick-up',
    input: { size: 'regular', finish: 'classic', mode: 'pickup' },
    total: 494,
    exVat: 412,
    contribution: 171,
    moonpig: null,
    saving: null,
  },
  {
    name: 'Regular Signature, advance, digital copy',
    input: { size: 'regular', finish: 'signature', mode: 'advance', digital: true },
    total: 523,
    exVat: 436,
    contribution: 217,
    moonpig: 589,
    saving: 95,
  },
  {
    name: 'Regular Signature, advance, flowers',
    input: { size: 'regular', finish: 'signature', mode: 'advance', gift: 'flowers' },
    total: 2894,
    exVat: 2412,
    contribution: 917,
    moonpig: 589,
    saving: 95,
  },
  {
    name: 'Standalone eCard',
    input: { size: 'regular', finish: 'signature', mode: 'ecard' },
    total: 79,
    exVat: 66,
    contribution: 32,
    moonpig: null,
    saving: null,
  },
  {
    name: 'First card free, Signature, advance',
    input: { size: 'regular', finish: 'signature', mode: 'advance', firstCardFree: true },
    total: 95,
    exVat: 79,
    contribution: -133,
    moonpig: null,
    saving: null,
  },
];

describe('canonical quotes', () => {
  it.each(CASES)('$name', ({ input, total, exVat, contribution, moonpig, saving }) => {
    const q = quote(input);
    expect(q.totalPence).toBe(total);
    expect(q.exVatPence).toBe(exVat);
    expect(Math.abs(q.contributionPence - contribution)).toBeLessThanOrEqual(1);
    if (input.firstCardFree) {
      expect(q.firstCardFree).toBe(true);
      expect(q.cardPence).toBe(0);
    } else {
      expect(q.moonpigPence).toBe(moonpig);
      expect(q.savingPence).toBe(saving);
    }
  });

  it('prices Large by advance post and Giant by tracked as specified', () => {
    const large = (finish: Finish) => quote({ size: 'large', finish, mode: 'advance' });
    expect([
      large('classic').totalPence,
      large('signature').totalPence,
      large('luxe').totalPence,
    ]).toEqual([694, 844, 1094]);
    expect([
      large('classic').contributionPence,
      large('signature').contributionPence,
      large('luxe').contributionPence,
    ]).toEqual([248, 348, 467]);
    const giant = (finish: Finish) => quote({ size: 'giant', finish, mode: 'tracked' });
    expect([
      giant('classic').totalPence,
      giant('signature').totalPence,
      giant('luxe').totalPence,
    ]).toEqual([1398, 1598, 1898]);
    expect([
      giant('classic').contributionPence,
      giant('signature').contributionPence,
      giant('luxe').contributionPence,
    ]).toEqual([416, 550, 715]);
    for (const finish of ['classic', 'signature', 'luxe'] as const)
      expect(large(finish).moonpigPence).toBeNull();
    for (const finish of ['classic', 'signature', 'luxe'] as const)
      expect(giant(finish).moonpigPence).toBeNull();
  });

  it('notes that Moonpig has no same-day card for pick-up and charges for pick-up', () => {
    const q = quote({ size: 'regular', finish: 'classic', mode: 'pickup' });
    expect(q.moonpigNote).toBe('Moonpig has no same-day physical card.');
    expect(q.deliveryPence).toBe(195);
    expect(q.lines.some((l) => /free/i.test(l.label))).toBe(false);
    expect(q.costs.printPence).toBe(200);
    expect(q.costs.deliveryPence).toBe(0);
  });

  it('offers pick-up only for Regular Classic or Signature', () => {
    expect(allowedModes('regular', 'classic')).toEqual(['advance', 'tracked', 'pickup']);
    expect(allowedModes('regular', 'signature')).toEqual(['advance', 'tracked', 'pickup']);
    expect(allowedModes('regular', 'luxe')).toEqual(['advance', 'tracked']);
    expect(allowedModes('large', 'classic')).toEqual(['advance', 'tracked']);
    expect(allowedModes('giant', 'signature')).toEqual(['tracked']);
    expect(() => quote({ size: 'regular', finish: 'luxe', mode: 'pickup' })).toThrow();
    expect(() => quote({ size: 'large', finish: 'classic', mode: 'pickup' })).toThrow();
  });

  it('applies first card free only to Regular Classic or Signature printed cards', () => {
    expect(
      quote({ size: 'regular', finish: 'luxe', mode: 'advance', firstCardFree: true })
        .firstCardFree,
    ).toBe(false);
    expect(
      quote({ size: 'large', finish: 'classic', mode: 'advance', firstCardFree: true })
        .firstCardFree,
    ).toBe(false);
    const free = quote({
      size: 'regular',
      finish: 'classic',
      mode: 'tracked',
      firstCardFree: true,
      digital: true,
      gift: 'choc',
    });
    expect(free.totalPence).toBe(275 + 29 + 1400);
  });
});

describe('business pricing', () => {
  it('matches the specified contributions per card', () => {
    expect(businessUnitContributionPence(businessUnitPricePence(100, 'posted'), 'posted')).toBe(
      136,
    );
    expect(businessUnitContributionPence(businessUnitPricePence(250, 'posted'), 'posted')).toBe(
      116,
    );
    expect(businessUnitContributionPence(businessUnitPricePence(2000, 'posted'), 'posted')).toBe(
      86,
    );
    expect(
      businessUnitContributionPence(businessUnitPricePence(5000, 'officeDrop'), 'officeDrop'),
    ).toBe(107);
  });
  it('prices 600 posted cards at the 250 tier at 1,860.00 with 695.40 contribution', () => {
    const b = priceBatch(600, {
      option: 'posted',
      finish: 'signature',
      annualCards: 600,
      automate: false,
    });
    expect(b.totalPence).toBe(186_000);
    expect(b.contributionPence).toBe(69_540);
    expect(b.contributionPerCardPence).toBe(116);
  });
  it('gives the first 25 cards free on the Automate plan', () => {
    const r = annualCalculator({ cardsPerYear: 400, postedShare: 0.7, automate: true });
    expect(r.includedCards).toBe(25);
    expect(r.subscriptionPence).toBe(4900 * 12);
  });
});

describe('operations formulas', () => {
  it('blends 20/60/20 Regular advance to 2.07, breaks even at 159,107 orders, 1.57 team cost at 210,000 orders', () => {
    const e = economics(DEFAULT_COSTS);
    expect(e.blendedContributionPence).toBe(207);
    expect(e.breakEvenOrders).toBe(159_107);
    expect(e.teamCostPerOrderPence(210_000)).toBe(157);
  });
  it('gives the florist 1.50 and Dearly 2.45 on a 35.00 basket', () => {
    expect(expectedCommissionPence(3500)).toBe(245);
  });
});

describe('price matrix snapshot', () => {
  it('every size, finish and mode', () => {
    const rows: string[] = [];
    for (const size of Object.keys(SIZES) as Size[]) {
      for (const finish of Object.keys(FINISHES) as Finish[]) {
        for (const mode of allowedModes(size, finish)) {
          const q = quote({ size, finish, mode });
          rows.push(
            `${size} ${finish} ${mode}: total ${q.totalPence} exVat ${q.exVatPence} contribution ${q.contributionPence} moonpig ${q.moonpigPence ?? '-'} saving ${q.savingPence ?? '-'}`,
          );
        }
      }
    }
    rows.push(
      `ecard: total ${quote({ size: 'regular', finish: 'signature', mode: 'ecard' }).totalPence}`,
    );
    expect(rows).toMatchSnapshot();
  });
});
