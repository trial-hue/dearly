import { addDays, daysBetween, startOfDay } from './calendar';
import { MODES, PICKUP, STAGES } from './constants';
import type { Finish, Mode, PrintedMode, Size, Stage } from './types';

/** Pick-up is offered only for Regular cards in Classic or Signature. */
export function pickupAllowed(size: Size, finish: Finish): boolean {
  return (
    (PICKUP.sizes as readonly string[]).includes(size) &&
    (PICKUP.finishes as readonly string[]).includes(finish)
  );
}

/**
 * Delivery mode rule:
 * giant -> tracked; 7+ days -> advance; 2-6 days -> tracked; under 2 days -> pick-up when the size
 * and finish allow it, otherwise tracked (with an on-the-day eCard offer).
 */
export function chooseMode(
  size: Size,
  daysLeft: number,
  finish: Finish = 'signature',
): PrintedMode {
  if (size === 'giant') return 'tracked';
  if (daysLeft >= 7) return 'advance';
  if (daysLeft >= 2) return 'tracked';
  return pickupAllowed(size, finish) ? 'pickup' : 'tracked';
}

/** Printed modes that have a price for the size, with pick-up limited by finish. */
export function allowedModes(size: Size, finish: Finish = 'signature'): PrintedMode[] {
  const out: PrintedMode[] = [];
  for (const mode of ['advance', 'tracked', 'pickup'] as const) {
    if (!Object.prototype.hasOwnProperty.call(MODES[mode].price, size)) continue;
    if (mode === 'pickup' && !pickupAllowed(size, finish)) continue;
    out.push(mode);
  }
  return out;
}

export function modePrice(mode: Mode, size: Size): number | null {
  const table: Record<string, number> = MODES[mode].price;
  return Object.prototype.hasOwnProperty.call(table, size) ? (table[size] as number) : null;
}

export function modeCost(mode: Mode, size: Size): number | null {
  const table: Record<string, number> = MODES[mode].cost;
  return Object.prototype.hasOwnProperty.call(table, size) ? (table[size] as number) : null;
}

/** When the card is promised to arrive. */
export function arrivalDate(mode: Mode, size: Size, occasionDate: Date, today: Date): Date {
  const t = startOfDay(today);
  const occ = startOfDay(occasionDate);
  if (mode === 'ecard' || mode === 'pickup') return t;
  const tomorrow = addDays(t, 1);
  if (mode === 'tracked' || size === 'giant') {
    const dayBefore = addDays(occ, -1);
    return dayBefore > t ? dayBefore : tomorrow;
  }
  const twoBefore = addDays(occ, -2);
  return twoBefore > t ? twoBefore : tomorrow;
}

/** Offer an on-the-day eCard alongside a printed card when it is under 2 days and pick-up is not allowed. */
export function offerEcardAlongside(
  size: Size,
  daysLeft: number,
  finish: Finish = 'signature',
): boolean {
  return daysLeft < 2 && !pickupAllowed(size, finish);
}

export function stagesFor(mode: Mode): readonly Stage[] {
  if (mode === 'ecard') return STAGES.ecard;
  if (mode === 'pickup') return STAGES.pickup;
  return STAGES.post;
}

export function nextStage(order: { mode: Mode; stage: Stage }): Stage | null {
  const stages = stagesFor(order.mode);
  const idx = stages.indexOf(order.stage);
  if (idx === -1) return stages[0] ?? null;
  return stages[idx + 1] ?? null;
}

export function isTerminal(stage: Stage): boolean {
  return stage === 'delivered' || stage === 'collected';
}

export function isLate(
  order: { stage: Stage; promisedDate: Date | string; delayed?: boolean },
  today: Date,
): boolean {
  if (order.delayed) return true;
  if (isTerminal(order.stage)) return false;
  const promised =
    typeof order.promisedDate === 'string' ? new Date(order.promisedDate) : order.promisedDate;
  return daysBetween(startOfDay(today), startOfDay(promised)) < 0;
}
