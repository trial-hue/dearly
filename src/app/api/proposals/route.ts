import { z } from 'zod';

import { OccasionTypeSchema, type OccasionType } from '@/domain';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { ok, problem, readJson } from '@/server/http';
import { createAdhocProposal, listProposals } from '@/server/services/proposals';

export const dynamic = 'force-dynamic';

export async function GET() {
  const accountId = await getAccountId();
  return ok(await listProposals(accountId, now()));
}

const Body = z.object({
  personId: z.string().min(1),
  type: OccasionTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: Request) {
  const body = await readJson(req, Body);
  if (!body.ok) return body.response;
  const accountId = await getAccountId();
  const view = await createAdhocProposal(
    accountId,
    { ...body.data, type: body.data.type as OccasionType },
    now(),
  );
  if (!view) return problem(404, 'Person not found');
  return ok(view, 201);
}
