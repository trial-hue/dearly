import { now } from '@/server/clock';
import { prisma } from '@/server/db';
import { ok } from '@/server/http';
import { resetRateLimits } from '@/server/rateLimit';
import { seedDemo } from '@/server/seed/seedDemo';

export async function POST() {
  resetRateLimits();
  await seedDemo(prisma, { reset: true, today: now() });
  return ok({ reset: true });
}
