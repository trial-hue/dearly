import { addDays, daysBetween, startOfDay } from './calendar';
import { MODES, STAGES } from './constants';
import type { Mode, PrintedMode, Size, Stage } from './types';

/**
 * Delivery mode rule:
 * giant -> tracked; 7+ days -> advance; 2-6 days -> tracked; under 2 days -> pickup (regular) or
 * tracked (large).
 */
export function chooseMode(size: Size, daysLeft: number): PrintedMode {
  if (size === 'giant') return 'tracked';
  if (daysLeft >= 7) return 'advance';
  if (daysLeft >= 2) return 'tracked';
  return size === 'regular' ? 'pickup' : 'tracked';
}

/** Printed modes that have a price for the size. */
export function allowedModes(size: Size): PrintedMode[] {
  const out: PrintedMode[] = [];
  for (const mode of ['advance', 'tracked', 'pickup'] as const) {
    if (Object.prototype.hasOwnProperty.call(MODES[mode].price, size)) out.push(mode);
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

/** Whether to offer an on-the-day eCard alongside a printed card (large card under 2 days). */
export function offerEcardAlongside(size: Size, daysLeft: number): boolean {
  return size !== 'regular' && daysLeft < 2;
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
