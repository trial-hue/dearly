import { BLEND, DEFAULT_COSTS, FORECAST } from './constants';
import { roundPence, toPence } from './money';
import { contributionExact, contributionTable } from './pricing';
import type { ContributionRow, Costs } from './types';

export interface Economics {
  table: ContributionRow[];
  blendedContributionPence: number;
  breakEvenOrders: number;
  breakEvenCustomers: number;
  teamCostPerOrderPence: (ordersPerYear: number) => number;
}

/** Exact blended contribution of a Regular card by advance post: 20% Classic, 60% Signature, 20% Luxe. */
export function blendedContributionExact(costs: Costs = DEFAULT_COSTS): number {
  const c = (finish: 'classic' | 'signature' | 'luxe') =>
    contributionExact({ size: 'regular', finish, mode: 'advance' }, costs);
  return BLEND.classic * c('classic') + BLEND.signature * c('signature') + BLEND.luxe * c('luxe');
}

/** Blended contribution rounded to whole pence for display. */
export function blendedContributionPence(costs: Costs = DEFAULT_COSTS): number {
  return roundPence(blendedContributionExact(costs));
}

export function economics(costs: Costs = DEFAULT_COSTS): Economics {
  const blendedExact = blendedContributionExact(costs);
  const teamPence = toPence(costs.teamPerYear);
  // The specification reports the quotient truncated to whole orders (33,000,000 / 207.41 = 159,107).
  const breakEvenOrders = blendedExact > 0 ? Math.floor(teamPence / blendedExact + 1e-9) : Infinity;
  return {
    table: contributionTable(costs),
    blendedContributionPence: roundPence(blendedExact),
    breakEvenOrders,
    breakEvenCustomers: Number.isFinite(breakEvenOrders)
      ? Math.ceil(breakEvenOrders / FORECAST.ordersPerCustomerYear)
      : Infinity,
    teamCostPerOrderPence: (ordersPerYear: number) =>
      ordersPerYear > 0 ? roundPence(teamPence / ordersPerYear) : 0,
  };
}

export function ordersPerYearFor(customers: number): number {
  return customers * FORECAST.ordersPerCustomerYear;
}
