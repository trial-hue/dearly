import { z } from 'zod';

import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { ok, readJson } from '@/server/http';
import { operationsScreen } from '@/server/services/operations';
import { updateSettings } from '@/server/services/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const accountId = await getAccountId();
  return ok(await operationsScreen(accountId, now()));
}

const Body = z.object({
  forecastCustomers: z.number().min(500).max(100_000).optional(),
  costs: z
    .object({
      payPct: z.number().min(0).max(0.2),
      payFixed: z.number().min(0).max(5),
      ai: z.number().min(0).max(5),
      service: z.number().min(0).max(5),
      guarantee: z.number().min(0).max(5),
      teamPerYear: z.number().min(0).max(50_000_000),
    })
    .partial()
    .optional(),
});

export async function PATCH(req: Request) {
  const body = await readJson(req, Body);
  if (!body.ok) return body.response;
  return ok(await updateSettings(body.data as Parameters<typeof updateSettings>[0]));
}
