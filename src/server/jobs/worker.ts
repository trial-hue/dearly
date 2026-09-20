/**
 * Background worker: polls the Job table and runs due jobs. Start with `pnpm worker` locally or
 * the `worker` service in docker-compose. "Run the next step" in the interface moves orders
 * through their stages; this loop handles time-based work such as on-the-day eCards.
 */
import { prisma } from '@/server/db';
import { logger } from '@/server/logger';

import { runDueJobs } from './handlers';

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS ?? 5000);
let stopping = false;

async function tick(): Promise<void> {
  const results = await runDueJobs(new Date());
  for (const r of results) logger.info({ job: r.type, id: r.id, ok: r.ok }, r.result);
}

async function main(): Promise<void> {
  logger.info({ intervalMs: INTERVAL_MS }, 'worker started');
  while (!stopping) {
    try {
      await tick();
    } catch (err) {
      logger.error({ err }, 'worker tick failed');
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  await prisma.$disconnect();
  logger.info('worker stopped');
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    stopping = true;
  });
}

main().catch((err) => {
  logger.error({ err }, 'worker crashed');
  process.exit(1);
});
