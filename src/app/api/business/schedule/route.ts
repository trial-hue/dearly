import { z } from 'zod';

import { FinishSchema } from '@/domain';
import { now } from '@/server/clock';
import { ok, problem, readJson } from '@/server/http';
import { scheduleBatch } from '@/server/services/business';

export const dynamic = 'force-dynamic';

const Row = z.object({
  raw: z.string().max(400),
  name: z.string().max(80),
  date: z.string().nullable(),
  monthDay: z.string().nullable(),
  year: z.number().int().nullable(),
  occasion: z.enum(['birthday', 'work_anniversary', 'leaving']),
  postcode: z.string().max(12),
  issue: z.string().max(300).nullable(),
});

const Body = z.object({
  option: z.enum(['posted', 'officeDrop']),
  finish: FinishSchema,
  automate: z.boolean().default(false),
  giantForLeavers: z.boolean().default(false),
  rows: z.array(Row).min(1).max(500),
});

export async function POST(req: Request) {
  const body = await readJson(req, Body);
  if (!body.ok) return body.response;
  const result = await scheduleBatch(body.data, now());
  if (!result) return problem(409, 'Nothing to schedule', 'Every row is flagged or has no date');
  return ok(
    {
      batchId: result.batch.id,
      cards: result.batch.cardCount,
      pricePence: result.pricing.totalPence,
      contributionPence: result.pricing.contributionPence,
    },
    201,
  );
}
