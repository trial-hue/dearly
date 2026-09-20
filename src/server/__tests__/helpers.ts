import { prisma } from '@/server/db';
import { resetRateLimits } from '@/server/rateLimit';
import { DEMO_ACCOUNT_ID, seedDemo } from '@/server/seed/seedDemo';

export { DEMO_ACCOUNT_ID };

/** A weekday with no seasonal peak, the same "today" the seed and the domain tests use. */
export const TODAY = new Date(2026, 8, 20);

/** Reseed the demo data from scratch so every test starts from the same state. */
export async function resetDemo(today: Date = TODAY): Promise<void> {
  resetRateLimits();
  await seedDemo(prisma, { reset: true, today });
}

/** Decision summaries in insertion order, optionally filtered by job. */
export async function decisionSummaries(job?: string): Promise<string[]> {
  const rows = await prisma.decision.findMany({
    where: job ? { job } : undefined,
    orderBy: { at: 'asc' },
  });
  return rows.map((r) => r.summary);
}
