import { z } from 'zod';

import { ok, readJson } from '@/server/http';
import { cleanWithRules } from '@/server/services/business';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await readJson(req, z.object({ text: z.string().min(1).max(20_000) }));
  if (!body.ok) return body.response;
  return ok({ rows: await cleanWithRules(body.data.text), by: 'rule' });
}
