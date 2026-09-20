import { z } from 'zod';

import { env } from '@/env';
import { runJob } from '@/server/ai/gateway';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { ok, problem, readJson } from '@/server/http';
import { rateLimit } from '@/server/rateLimit';
import { applyAgentAction, ordersForAgent } from '@/server/services/orders';

export const dynamic = 'force-dynamic';

const Body = z.object({
  message: z.string().min(1).max(2000),
  turns: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(2000) }))
    .max(12)
    .default([]),
});

/** One help-agent turn: answer, pick an allowed action, execute it and log it. */
export async function POST(req: Request) {
  const body = await readJson(req, Body);
  if (!body.ok) return body.response;
  const accountId = await getAccountId();
  const limit = rateLimit(`agent:${accountId}`, env.RATE_LIMIT_AI_PER_MIN);
  if (!limit.ok)
    return problem(429, 'Too many messages', `Try again in ${limit.retryAfterSec} seconds`);
  const today = now();
  const orders = await ordersForAgent(accountId, today);
  const r = await runJob('agent_turn', {
    message: body.data.message,
    orders,
    turns: body.data.turns.slice(-6),
  });
  const applied = await applyAgentAction(r.result.orderId, r.result.action, accountId, today, r.by);
  return ok({
    reply: r.result.reply,
    action: r.result.action,
    orderId: r.result.orderId,
    by: r.by,
    applied,
    note: r.note,
  });
}
