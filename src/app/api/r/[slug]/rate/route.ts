import { z } from 'zod';

import { ok, problem, readJson } from '@/server/http';
import { rateOrder } from '@/server/services/orders';

export const dynamic = 'force-dynamic';

const Body = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(280).nullable().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await readJson(req, Body);
  if (!body.ok) return body.response;
  const done = await rateOrder(slug, body.data.stars, body.data.comment ?? null);
  return done ? ok({ rated: true }) : problem(404, 'Card not found');
}
