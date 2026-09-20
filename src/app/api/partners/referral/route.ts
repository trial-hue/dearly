import { z } from 'zod';

import { OccasionTypeSchema, type OccasionType } from '@/domain';
import { now } from '@/server/clock';
import { ok, readJson } from '@/server/http';
import { createReferral } from '@/server/services/partners';

export const dynamic = 'force-dynamic';

const Body = z.object({
  readBy: z.enum(['ai', 'rule']).default('rule'),
  reading: z.object({
    recipient: z.string().min(1).max(80),
    relationship: z.string().max(40),
    occasion: OccasionTypeSchema,
    date: z.string().nullable(),
    age: z.number().int().nullable(),
    customer: z.string().max(80).nullable(),
    basketPence: z.number().int().nullable(),
  }),
});

export async function POST(req: Request) {
  const body = await readJson(req, Body);
  if (!body.ok) return body.response;
  const referral = await createReferral(
    { ...body.data.reading, occasion: body.data.reading.occasion as OccasionType },
    body.data.readBy,
    now(),
  );
  return ok({ id: referral.id }, 201);
}
