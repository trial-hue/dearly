import { STAMPS, economics, forecast, toPence, type Actor } from '@/domain';
import { prisma } from '@/server/db';

import * as decisions from './decisionLog';
import { printerScores } from './orders';
import { getSettings } from './settings';

export interface Counters {
  reminders: number;
  proposals: number;
  approved: number;
  skipped: number;
  approvalRate: number | null;
  printedOrders: number;
  advanceOrders: number;
  advanceShare: number | null;
  postageSavedPence: number;
  avgContributionPence: number | null;
  decisionsByActor: Record<Actor, number>;
  recipientsJoined: number;
  batches: number;
  referrals: number;
  openJobs: number;
}

export async function counters(accountId: string): Promise<Counters> {
  const [
    reminders,
    proposalsByStatus,
    orders,
    byActor,
    recipientsJoined,
    batches,
    referrals,
    openJobs,
  ] = await Promise.all([
    prisma.occasion.count({ where: { person: { accountId, pausedReason: null } } }),
    prisma.proposal.groupBy({
      by: ['status'],
      where: { person: { accountId } },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: { accountId },
      select: { mode: true, quote: true },
    }),
    decisions.countsByActor(),
    prisma.inventoryItem.count({ where: { direction: 'received', orderId: { not: null } } }),
    prisma.batch.count(),
    prisma.referral.count(),
    prisma.job.count({ where: { status: 'queued' } }),
  ]);
  const count = (status: string) =>
    proposalsByStatus.find((p) => p.status === status)?._count._all ?? 0;
  const approved = count('approved');
  const skipped = count('skipped');
  const decided = approved + skipped;
  const printed = orders.filter((o) => o.mode !== 'ecard');
  const advance = printed.filter((o) => o.mode === 'advance');
  const contributions = orders.map(
    (o) => (o.quote as { contributionPence?: number }).contributionPence ?? 0,
  );
  return {
    reminders,
    proposals: proposalsByStatus.reduce((s, p) => s + p._count._all, 0),
    approved,
    skipped,
    approvalRate: decided ? Math.round((approved / decided) * 100) : null,
    printedOrders: printed.length,
    advanceOrders: advance.length,
    advanceShare: printed.length ? Math.round((advance.length / printed.length) * 100) : null,
    // Estimate: every advance order goes second class instead of first class.
    postageSavedPence: advance.length * (toPence(STAMPS.firstClass) - toPence(STAMPS.secondClass)),
    avgContributionPence: contributions.length
      ? Math.round(contributions.reduce((a, b) => a + b, 0) / contributions.length)
      : null,
    decisionsByActor: byActor,
    recipientsJoined,
    batches,
    referrals,
    openJobs,
  };
}

export async function operationsScreen(accountId: string, today: Date) {
  const settings = await getSettings();
  const [c, printers, recent, batches, referrals] = await Promise.all([
    counters(accountId),
    printerScores(),
    decisions.recent(30),
    prisma.batch.findMany({
      include: { organisation: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.referral.findMany({
      include: { partner: true, person: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);
  const econ = economics(settings.costs);
  return {
    settings,
    counters: c,
    printers,
    decisions: recent,
    batches,
    referrals,
    forecast: forecast(settings.forecastCustomers, today),
    economics: {
      table: econ.table,
      blendedContributionPence: econ.blendedContributionPence,
      breakEvenOrders: econ.breakEvenOrders,
      breakEvenCustomers: econ.breakEvenCustomers,
      teamCostPerOrderPence: econ.teamCostPerOrderPence(settings.forecastCustomers * 4),
    },
  };
}
