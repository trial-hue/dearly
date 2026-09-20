import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { ok } from '@/server/http';
import { runDueJobs } from '@/server/jobs/handlers';
import { advanceAll } from '@/server/services/orders';

export const dynamic = 'force-dynamic';

/** "Run the next step": every open order moves one stage and due background jobs run. */
export async function POST() {
  const accountId = await getAccountId();
  const result = await advanceAll(accountId, now());
  const jobs = await runDueJobs(new Date());
  return ok({ ...result, jobs: jobs.length });
}
