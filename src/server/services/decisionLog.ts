import type { Actor } from '@/domain';
import { prisma } from '@/server/db';

export interface DecisionInput {
  actor: Actor;
  job: string;
  summary: string;
  orderId?: string | null;
  costMicroPence?: number;
}

/** Every automated or human decision is written here; Operations shows the latest 30. */
export async function record(input: DecisionInput) {
  return prisma.decision.create({
    data: {
      actor: input.actor,
      job: input.job,
      summary: input.summary.slice(0, 500),
      orderId: input.orderId ?? null,
      costMicroPence: input.costMicroPence ?? 0,
    },
  });
}

export async function recordMany(inputs: DecisionInput[]) {
  if (inputs.length === 0) return;
  await prisma.decision.createMany({
    data: inputs.map((i) => ({
      actor: i.actor,
      job: i.job,
      summary: i.summary.slice(0, 500),
      orderId: i.orderId ?? null,
      costMicroPence: i.costMicroPence ?? 0,
    })),
  });
}

export async function recent(limit = 30) {
  return prisma.decision.findMany({ orderBy: { at: 'desc' }, take: limit });
}

export async function countsByActor(): Promise<Record<Actor, number>> {
  const rows = await prisma.decision.groupBy({ by: ['actor'], _count: { _all: true } });
  const out: Record<Actor, number> = { ai: 0, rule: 0, person: 0 };
  for (const r of rows) {
    if (r.actor === 'ai' || r.actor === 'rule' || r.actor === 'person')
      out[r.actor] = r._count._all;
  }
  return out;
}
