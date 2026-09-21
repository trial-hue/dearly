import { addDays, daysBetween, startOfDay } from './calendar';

/** The reminder steps before an occasion, in days ahead. */
export const REMINDER_STEPS = [
  { step: 'd21', daysBefore: 21 },
  { step: 'd14', daysBefore: 14 },
  { step: 'd7', daysBefore: 7 },
  { step: 'd3', daysBefore: 3 },
  { step: 'd1', daysBefore: 1 },
] as const;

export type ReminderStep = (typeof REMINDER_STEPS)[number]['step'];

export interface ScheduledStep {
  step: ReminderStep;
  scheduledFor: Date;
}

/**
 * The reminders still to send for an occasion: 21, 14, 7, 3 and 1 days before it, at 9am,
 * dropping any step whose day has already passed. A paused person gets none.
 */
export function scheduleFor(occasionDate: Date, today: Date, paused: boolean): ScheduledStep[] {
  if (paused) return [];
  const occasion = startOfDay(occasionDate);
  const t = startOfDay(today);
  const out: ScheduledStep[] = [];
  for (const s of REMINDER_STEPS) {
    const day = addDays(occasion, -s.daysBefore);
    if (daysBetween(t, day) < 0) continue;
    const at = new Date(day);
    at.setHours(9, 0, 0, 0);
    out.push({ step: s.step, scheduledFor: at });
  }
  return out;
}
