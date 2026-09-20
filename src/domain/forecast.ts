import { addDays, daysBetween, monthDayOf, parseIsoDate, startOfWeek } from './calendar';
import { FEASTS, FORECAST } from './constants';
import type { WeekForecast } from './types';

function inRange(monthDay: string, from: string, to: string): boolean {
  return monthDay >= from && monthDay <= to;
}

/** The peak multiplier that applies to a week, judged by any day of the week falling in a peak. */
export function weekMultiplier(weekStart: Date): { multiplier: number; peak: string | null } {
  let multiplier = 1;
  let peak: string | null = null;
  const mothersDays = FEASTS.mothers_day
    .map((iso) => parseIsoDate(iso))
    .filter((d): d is Date => d !== null);
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    const md = monthDayOf(day);
    const { christmas, valentine, mothersDay } = FORECAST.peaks;
    if (inRange(md, christmas.from, christmas.to) && christmas.multiplier > multiplier) {
      multiplier = christmas.multiplier;
      peak = christmas.label;
    }
    if (inRange(md, valentine.from, valentine.to) && valentine.multiplier > multiplier) {
      multiplier = valentine.multiplier;
      peak = valentine.label;
    }
    for (const md2 of mothersDays) {
      const until = daysBetween(day, md2);
      if (until >= 1 && until <= mothersDay.daysBefore && mothersDay.multiplier > multiplier) {
        multiplier = mothersDay.multiplier;
        peak = mothersDay.label;
      }
    }
  }
  return { multiplier, peak };
}

/**
 * Weekly order forecast for a simulated customer base: 4 orders a customer a year, split
 * 72/20/8 across advance, tracked and pick-up, with seasonal multipliers.
 */
export function forecast(customers: number, today: Date, weeks = 13): WeekForecast[] {
  const base = (customers * FORECAST.ordersPerCustomerYear) / 52;
  const start = startOfWeek(today);
  const out: WeekForecast[] = [];
  for (let w = 0; w < weeks; w++) {
    const weekStart = addDays(start, w * 7);
    const { multiplier, peak } = weekMultiplier(weekStart);
    const total = Math.round(base * multiplier);
    const advance = Math.round(total * FORECAST.split.advance);
    const tracked = Math.round(total * FORECAST.split.tracked);
    const pickup = total - advance - tracked;
    out.push({ weekStart, total, advance, tracked, pickup, peak, multiplier });
  }
  return out;
}
