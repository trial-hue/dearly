import { env } from '@/env';
import { prisma } from '@/server/db';
import { ok } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  let db: 'ok' | 'error' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = 'error';
  }
  return ok(
    {
      status: db === 'ok' ? 'ok' : 'degraded',
      db,
      version: env.APP_VERSION,
      time: new Date().toISOString(),
    },
    db === 'ok' ? 200 : 503,
  );
}
