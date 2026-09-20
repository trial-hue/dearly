import { DEFAULT_COSTS, FORECAST } from './constants';
import { toPence } from './money';
import { contributionTable, quote } from './pricing';
import type { ContributionRow, Costs } from './types';

export interface Economics {
  table: ContributionRow[];
  blendedContributionPence: number;
  breakEvenOrders: number;
  breakEvenCustomers: number;
  teamCostPerOrderPence: (ordersPerYear: number) => number;
}

/** Contribution of a Regular Signature card weighted by the forecast mode split. */
export function blendedContributionPence(costs: Costs = DEFAULT_COSTS): number {
  const { advance, tracked, pickup } = FORECAST.split;
  const c = (mode: 'advance' | 'tracked' | 'pickup') =>
    quote({ size: 'regular', finish: 'signature', mode }, costs).contributionPence;
  return Math.round(advance * c('advance') + tracked * c('tracked') + pickup * c('pickup'));
}

export function economics(costs: Costs = DEFAULT_COSTS): Economics {
  const blended = blendedContributionPence(costs);
  const teamPence = toPence(costs.teamPerYear);
  const breakEvenOrders = blended > 0 ? Math.ceil(teamPence / blended) : Infinity;
  return {
    table: contributionTable(costs),
    blendedContributionPence: blended,
    breakEvenOrders,
    breakEvenCustomers: Number.isFinite(breakEvenOrders)
      ? Math.ceil(breakEvenOrders / FORECAST.ordersPerCustomerYear)
      : Infinity,
    teamCostPerOrderPence: (ordersPerYear: number) =>
      ordersPerYear > 0 ? Math.round(teamPence / ordersPerYear) : 0,
  };
}

export function ordersPerYearFor(customers: number): number {
  return customers * FORECAST.ordersPerCustomerYear;
}
