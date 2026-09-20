import { describe, expect, it } from 'vitest';

import { planRecovery, recoveryCostPence } from '../recovery';

const today = new Date(2026, 8, 20);

describe('planRecovery', () => {
  it('refunds only under the guarantee and reprints only with two or more days left', () => {
    const guaranteed = planRecovery(
      {
        id: 'ord_1',
        mode: 'advance',
        guarantee: true,
        totalPence: 494,
        occasionDate: new Date(2026, 8, 24),
      },
      today,
    );
    expect(guaranteed.map((a) => a.type)).toEqual(['ecard', 'refund', 'discount', 'reprint']);
    expect(guaranteed.find((a) => a.type === 'refund')?.pence).toBe(494);

    const pickup = planRecovery(
      {
        id: 'ord_2',
        mode: 'pickup',
        guarantee: false,
        totalPence: 299,
        occasionDate: new Date(2026, 8, 24),
      },
      today,
    );
    expect(pickup.map((a) => a.type)).toEqual(['ecard', 'discount', 'reprint']);

    const tomorrow = planRecovery(
      {
        id: 'ord_3',
        mode: 'tracked',
        guarantee: true,
        totalPence: 674,
        occasionDate: new Date(2026, 8, 21),
      },
      today,
    );
    expect(tomorrow.map((a) => a.type)).toEqual(['ecard', 'refund', 'discount']);
    expect(recoveryCostPence(tomorrow)).toBe(674);
  });
});
