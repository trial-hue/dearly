import { z } from 'zod';

import { addDays } from '@/domain';
import { now } from '@/server/clock';
import { ok, readJson } from '@/server/http';
import { sendDue } from '@/server/services/notifications';

export const dynamic = 'force-dynamic';

const Body = z.object({
  action: z.literal('send_due'),
  daysAhead: z.number().int().min(0).max(60).default(0),
});

/** The simulated sender: marks every message due by now (plus an optional jump) as sent. */
export async function POST(req: Request) {
  const body = await readJson(req, Body);
  if (!body.ok) return body.response;
  const sent = await sendDue(addDays(now(), body.data.daysAhead));
  return ok({ sent });
}
