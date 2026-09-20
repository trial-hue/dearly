import { beforeEach, describe, expect, it } from 'vitest';

import { sampleFloristOrder } from '@/domain';
import { runJob } from '@/server/ai/gateway';
import { MockProvider } from '@/server/ai/mockProvider';
import { prisma } from '@/server/db';
import { SEED_SLUGS } from '@/server/seed/seedDemo';
import { countsByActor } from '@/server/services/decisionLog';
import { counters } from '@/server/services/operations';
import { advanceAll, delayOrder, rateOrder, saveToInventory } from '@/server/services/orders';
import { createReferral } from '@/server/services/partners';
import { pausePerson } from '@/server/services/people';
import { approveProposal, ensureProposals } from '@/server/services/proposals';

import { DEMO_ACCOUNT_ID, TODAY, resetDemo } from './helpers';

describe('G6 every automated step writes a decision', () => {
  beforeEach(() => resetDemo());

  it('records actor ai, rule or person for each step, and the Operations counters equal the decision table', async () => {
    await ensureProposals(DEMO_ACCOUNT_ID, TODAY);
    await approveProposal('person_dan|birthday|2026', DEMO_ACCOUNT_ID, TODAY);
    await delayOrder('ord_seed_priya', DEMO_ACCOUNT_ID, TODAY);
    await advanceAll(DEMO_ACCOUNT_ID, TODAY);
    await rateOrder(SEED_SLUGS.danDelivered, 5, 'Lovely');
    await saveToInventory(SEED_SLUGS.danDelivered);
    await pausePerson('person_noor', 'moved abroad', 'person', TODAY);
    const reading = await runJob(
      'read_florist_order',
      { text: sampleFloristOrder(TODAY) },
      { provider: new MockProvider() },
    );
    await createReferral(reading.result, reading.by, TODAY);
    await runJob('life_event', { text: 'nothing new', people: [] }, { provider: null });

    const rows = await prisma.decision.findMany();
    expect(rows.length).toBeGreaterThan(10);
    for (const r of rows) expect(['ai', 'rule', 'person']).toContain(r.actor);
    expect(rows.some((r) => r.actor === 'ai')).toBe(true);
    expect(rows.some((r) => r.actor === 'rule')).toBe(true);
    expect(rows.some((r) => r.actor === 'person')).toBe(true);
    for (const job of [
      'proposals',
      'approve',
      'payment',
      'fulfilment',
      'delay',
      'recovery',
      'rating',
      'growth',
      'life_event',
      'read_florist_order',
      'referral',
    ])
      expect(
        rows.some((r) => r.job === job),
        job,
      ).toBe(true);

    const grouped = await prisma.decision.groupBy({ by: ['actor'], _count: { _all: true } });
    const expected = Object.fromEntries(grouped.map((g) => [g.actor, g._count._all]));
    const byActor = await countsByActor();
    expect(byActor).toMatchObject(expected);
    const c = await counters(DEMO_ACCOUNT_ID);
    expect(c.decisionsByActor).toEqual(byActor);
  });
});
