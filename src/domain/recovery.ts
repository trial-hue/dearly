import { daysBetween, isoDate, startOfDay } from './calendar';
import { MODES, PRINT_COST } from './constants';
import { toPence } from './money';
import type { OrderForRecovery, RecoveryAction } from './types';

/**
 * Recovery when a posted card is delayed: an on-the-day eCard, a full refund when the mode
 * carries the guarantee, a 50% next-card code, and a tracked reprint when two or more days remain.
 */
export function planRecovery(
  order: OrderForRecovery,
  today: Date,
  size: 'regular' | 'large' | 'giant' = 'regular',
): RecoveryAction[] {
  const occasion = startOfDay(new Date(order.occasionDate));
  const daysLeft = daysBetween(startOfDay(today), occasion);
  const actions: RecoveryAction[] = [
    {
      type: 'ecard',
      label: `On-the-day eCard scheduled for ${isoDate(occasion)}`,
      pence: 0,
      detail: 'Sent by link on the morning of the occasion so nothing is missed.',
    },
  ];
  if (order.guarantee) {
    actions.push({
      type: 'refund',
      label: 'Full refund under the delivery guarantee',
      pence: order.totalPence,
      detail: 'Refunded to the original payment method (simulated).',
    });
  }
  actions.push({
    type: 'discount',
    label: '50% off the next card',
    pence: 0,
    detail: `Code DEARLY50-${order.id.slice(-4).toUpperCase()}`,
  });
  if (daysLeft >= 2) {
    const reprintCost = toPence(PRINT_COST[size].signature) + toPence(MODES.tracked.cost[size]);
    actions.push({
      type: 'reprint',
      label: 'Tracked reprint sent today',
      pence: reprintCost,
      detail: `Arrives ${daysLeft >= 2 ? 'before the occasion' : 'as soon as possible'}, tracked next day.`,
    });
  }
  return actions;
}

export function recoveryCostPence(actions: readonly RecoveryAction[]): number {
  return actions.reduce((sum, a) => sum + a.pence, 0);
}
