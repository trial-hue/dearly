import { z } from 'zod';

import { DesignSchema, FontSchema, OccasionTypeSchema, type OccasionType } from '@/domain';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { ok, problem, readJson } from '@/server/http';
import { sendEcard } from '@/server/services/ecards';

export const dynamic = 'force-dynamic';

const Body = z.object({
  personId: z.string().min(1),
  occasion: OccasionTypeSchema,
  message: z.string().min(1).max(600),
  font: FontSchema,
  design: DesignSchema,
  animation: z.enum(['envelope', 'flip', 'confetti']),
  drawingMediaId: z.string().nullable().default(null),
  narrationMediaId: z.string().nullable().default(null),
  clipMediaId: z.string().nullable().default(null),
  wordTimings: z.array(z.number().nonnegative()).max(400).default([]),
});

export async function POST(req: Request) {
  const body = await readJson(req, Body);
  if (!body.ok) return body.response;
  const accountId = await getAccountId();
  const result = await sendEcard(
    accountId,
    { ...body.data, occasion: body.data.occasion as OccasionType },
    now(),
  );
  return result ? ok(result, 201) : problem(404, 'Person not found');
}
