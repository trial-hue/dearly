import { z } from 'zod';

import { OccasionTypeSchema, type ImportedPerson, type OccasionType } from '@/domain';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { ok, problem, readJson } from '@/server/http';
import {
  addPeople,
  confirmAddress,
  getPerson,
  listPeople,
  pausePerson,
  resumePerson,
} from '@/server/services/people';

export const dynamic = 'force-dynamic';

export async function GET() {
  const accountId = await getAccountId();
  return ok(await listPeople(accountId, now()));
}

const AddBody = z.object({
  people: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        relationship: z.string().max(40),
        occasion: OccasionTypeSchema,
        month: z.number().int().min(1).max(12).nullable(),
        day: z.number().int().min(1).max(31).nullable(),
        year: z.number().int().min(1900).max(2100).nullable(),
      }),
    )
    .min(1)
    .max(200),
});

export async function POST(req: Request) {
  const body = await readJson(req, AddBody);
  if (!body.ok) return body.response;
  const accountId = await getAccountId();
  const count = await addPeople(
    accountId,
    body.data.people.map((p): ImportedPerson => ({ ...p, occasion: p.occasion as OccasionType })),
    'person',
    now(),
  );
  return ok({ added: count }, 201);
}

const PatchBody = z.discriminatedUnion('action', [
  z.object({ action: z.literal('pause'), id: z.string(), reason: z.string().min(1).max(120) }),
  z.object({ action: z.literal('resume'), id: z.string() }),
  z.object({ action: z.literal('confirm_address'), id: z.string() }),
]);

export async function PATCH(req: Request) {
  const body = await readJson(req, PatchBody);
  if (!body.ok) return body.response;
  const accountId = await getAccountId();
  const person = await getPerson(body.data.id);
  if (!person || person.accountId !== accountId) return problem(404, 'Person not found');
  const today = now();
  switch (body.data.action) {
    case 'pause':
      await pausePerson(person.id, body.data.reason, 'person', today);
      break;
    case 'resume':
      await resumePerson(person.id);
      break;
    case 'confirm_address':
      await confirmAddress(person.id, today);
      break;
  }
  return ok({ done: true });
}
