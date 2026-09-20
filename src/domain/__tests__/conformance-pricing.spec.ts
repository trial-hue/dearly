import { describe, expect, it } from 'vitest';

import { annualCalculator, businessUnitPricePence, priceBatch } from '../business';
import {
  BUSINESS,
  DEFAULT_COSTS,
  DIGITAL,
  FINISHES,
  GIFTS,
  GIFT_COST_SHARE,
  MODES,
  MOONPIG,
  SIZES,
} from '../constants';
import { allowedModes, arrivalDate, chooseMode } from '../delivery';
import { expectedCommissionPence } from '../florist';
import { exVatExact, roundPence, toPence } from '../money';
import { quote } from '../pricing';
import type { Finish, GiftId, PrintedMode, Size } from '../types';

const sizes = Object.keys(SIZES) as Size[];
const finishes = Object.keys(FINISHES) as Finish[];
const gifts = GIFTS.map((g) => g.id) as GiftId[];

/** A10: every valid size, finish, mode, gift and digital combination. */
describe('A10 quote invariants', () => {
  const cases: { size: Size; finish: Finish; mode: PrintedMode; gift: GiftId; digital: boolean }[] =
    [];
  for (const size of sizes)
    for (const finish of finishes)
      for (const mode of allowedModes(size, finish))
        for (const gift of gifts)
          for (const digital of [false, true]) cases.push({ size, finish, mode, gift, digital });

  it('covers every combination the delivery rule allows', () => {
    expect(cases.length).toBeGreaterThan(100);
  });

  it.each(cases)('$size $finish $mode gift=$gift digital=$digital', (c) => {
    const q = quote(c);
    // The total is the sum of the lines the customer sees.
    expect(q.lines.reduce((s, l) => s + l.pence, 0)).toBe(q.totalPence);
    expect(q.totalPence).toBe(
      q.cardPence +
        q.deliveryPence +
        (c.digital ? toPence(DIGITAL.paired) : 0) +
        toPence(GIFTS.find((g) => g.id === c.gift)?.price ?? 0),
    );
    // Contribution = total / 1.2 - costs, rounded once at the end (1p tolerance on contributions).
    const costs = q.costs;
    const exactCosts =
      costs.printPence +
      costs.deliveryPence +
      DEFAULT_COSTS.payPct * q.totalPence +
      toPence(DEFAULT_COSTS.payFixed) +
      costs.aiPence +
      costs.servicePence +
      costs.guaranteePence +
      exVatExact(toPence(GIFTS.find((g) => g.id === c.gift)?.price ?? 0)) * GIFT_COST_SHARE;
    expect(
      Math.abs(q.contributionPence - (exVatExact(q.totalPence) - exactCosts)),
    ).toBeLessThanOrEqual(1);
    expect(Math.abs(q.costs.totalPence - exactCosts)).toBeLessThanOrEqual(1);
    expect(q.exVatPence).toBe(roundPence(exVatExact(q.totalPence)));
    // Guarantee reserve only on guaranteed modes; pick-up carries none.
    expect(q.guarantee).toBe(MODES[c.mode].guarantee);
    expect(q.costs.guaranteePence).toBe(
      MODES[c.mode].guarantee ? toPence(DEFAULT_COSTS.guarantee) : 0,
    );
  });

  it('contribution rises with finish within a size for every mode and gift', () => {
    for (const size of sizes)
      for (const mode of allowedModes(size, 'classic'))
        for (const gift of gifts) {
          const c = (finish: Finish) =>
            allowedModes(size, finish).includes(mode)
              ? quote({ size, finish, mode, gift }).contributionPence
              : null;
          const classic = c('classic');
          const signature = c('signature');
          const luxe = c('luxe');
          if (classic != null && signature != null) expect(signature).toBeGreaterThan(classic);
          if (signature != null && luxe != null) expect(luxe).toBeGreaterThan(signature);
        }
  });
});

describe('A4 pick-up', () => {
  it('is offered only for Regular Classic and Regular Signature at the pick-up price with no guarantee', () => {
    for (const size of sizes)
      for (const finish of finishes) {
        const offered = allowedModes(size, finish).includes('pickup');
        expect(offered).toBe(size === 'regular' && finish !== 'luxe');
      }
    const q = quote({ size: 'regular', finish: 'signature', mode: 'pickup' });
    expect(q.deliveryPence).toBe(toPence(MODES.pickup.price.regular));
    expect(q.deliveryPence).toBe(195);
    expect(q.guarantee).toBe(false);
    expect(MODES.pickup.desc).not.toMatch(/arrive|free/i);
  });
});

describe('A5 Giant', () => {
  it('always ships tracked at the Giant tracked price and never by advance post', () => {
    for (const finish of finishes) {
      expect(allowedModes('giant', finish)).toEqual(['tracked']);
      for (const days of [0, 1, 2, 6, 7, 30, 120])
        expect(chooseMode('giant', days, finish)).toBe('tracked');
      expect(quote({ size: 'giant', finish, mode: 'tracked' }).deliveryPence).toBe(399);
      expect(() => quote({ size: 'giant', finish, mode: 'advance' })).toThrow();
    }
  });
});

describe('A6 Moonpig comparison', () => {
  it('appears only for printed Regular cards, uses 5.89 or 6.78, and is negative (hidden) for Luxe', () => {
    for (const size of sizes)
      for (const finish of finishes)
        for (const mode of allowedModes(size, finish)) {
          const q = quote({ size, finish, mode });
          if (size !== 'regular' || mode === 'pickup') {
            expect(q.moonpigPence).toBeNull();
            expect(q.savingPence).toBeNull();
          } else {
            expect(q.moonpigPence).toBe(mode === 'advance' ? 589 : 678);
            expect(q.savingPence).toBe((q.moonpigPence ?? 0) - (q.cardPence + q.deliveryPence));
            if (finish === 'luxe') expect(q.savingPence).toBeLessThan(0);
            else expect(q.savingPence).toBeGreaterThan(0);
          }
        }
    expect(quote({ size: 'regular', finish: 'signature', mode: 'ecard' }).moonpigPence).toBeNull();
    expect(toPence(MOONPIG.card) + toPence(MOONPIG.firstClass)).toBe(589);
    expect(toPence(MOONPIG.card) + toPence(MOONPIG.tracked)).toBe(678);
  });
});

describe('A7 digital', () => {
  it('prices the digital copy at 0.29 only with a printed card and the standalone eCard at 0.79', () => {
    expect(toPence(DIGITAL.paired)).toBe(29);
    expect(toPence(DIGITAL.standalone)).toBe(79);
    const printed = quote({ size: 'regular', finish: 'signature', mode: 'advance', digital: true });
    expect(
      printed.totalPence -
        quote({ size: 'regular', finish: 'signature', mode: 'advance' }).totalPence,
    ).toBe(29);
    const ecard = quote({ size: 'regular', finish: 'signature', mode: 'ecard', digital: true });
    expect(ecard.totalPence).toBe(79);
    expect(ecard.lines).toHaveLength(1);
  });
});

describe('C1 and C2 delivery rule and promises', () => {
  const today = new Date(2026, 8, 23);
  it('C1 chooses pick-up, pick-up, tracked, tracked, advance, advance for Regular Signature and tracked for Regular Luxe under two days', () => {
    expect([0, 1, 2, 6, 7, 30].map((d) => chooseMode('regular', d, 'signature'))).toEqual([
      'pickup',
      'pickup',
      'tracked',
      'tracked',
      'advance',
      'advance',
    ]);
    expect([0, 1].map((d) => chooseMode('regular', d, 'luxe'))).toEqual(['tracked', 'tracked']);
  });
  it('C2 promises advance two days before the occasion and tracked the day before', () => {
    for (const daysLeft of [7, 12, 30, 100]) {
      const occasion = new Date(2026, 8, 23 + daysLeft);
      expect(arrivalDate('advance', 'regular', occasion, today)).toEqual(
        new Date(2026, 8, 23 + daysLeft - 2),
      );
      expect(arrivalDate('tracked', 'regular', occasion, today)).toEqual(
        new Date(2026, 8, 23 + daysLeft - 1),
      );
    }
    for (const daysLeft of [2, 3, 6]) {
      const occasion = new Date(2026, 8, 23 + daysLeft);
      expect(arrivalDate('tracked', 'regular', occasion, today)).toEqual(
        new Date(2026, 8, 23 + daysLeft - 1),
      );
    }
  });
});

describe('E2 to E4 business prices', () => {
  it('E2 tiers posted cards at 3.30, 3.10 from 250 and 2.80 from 2,000; office drop 2.30 at every volume; first 25 free; Automate 49.00 a month', () => {
    expect(businessUnitPricePence(1, 'posted')).toBe(330);
    expect(businessUnitPricePence(249, 'posted')).toBe(330);
    expect(businessUnitPricePence(250, 'posted')).toBe(310);
    expect(businessUnitPricePence(1999, 'posted')).toBe(310);
    expect(businessUnitPricePence(2000, 'posted')).toBe(280);
    for (const n of [1, 250, 2000, 50_000])
      expect(businessUnitPricePence(n, 'officeDrop')).toBe(230);
    expect(BUSINESS.freeCards).toBe(25);
    expect(toPence(BUSINESS.automateMonthly)).toBe(4900);
    const b = priceBatch(30, {
      option: 'posted',
      finish: 'signature',
      annualCards: 30,
      automate: true,
    });
    expect(b.freeCards).toBe(25);
    expect(b.totalPence).toBe(5 * 330);
  });
  it('E3 prices a 600-card posted batch at the 250 tier at 1,860.00 with 695.40 contribution', () => {
    const b = priceBatch(600, {
      option: 'posted',
      finish: 'signature',
      annualCards: 600,
      automate: false,
    });
    expect(b.totalPence).toBe(186_000);
    expect(b.contributionPence).toBe(69_540);
  });
  it('E4 compares against 3.60 a card and shows the saving', () => {
    const r = annualCalculator({ cardsPerYear: 400, postedShare: 0.7, automate: false });
    expect(r.moonpigPence).toBe(400 * 360);
    expect(r.savingPence).toBe(r.moonpigPence - r.dearlyPence);
    expect(r.savingPence).toBeGreaterThan(0);
  });
});

describe('F2 florist ledger', () => {
  it('owes 1.50 per new account and expects 2.45 commission on a 35.00 basket', () => {
    expect(expectedCommissionPence(3500)).toBe(245);
  });
});
