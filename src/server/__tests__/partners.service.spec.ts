import { beforeEach, describe, expect, it } from 'vitest';

import { addDays, isoDate, sampleFloristOrder } from '@/domain';
import { runJob } from '@/server/ai/gateway';
import { MockProvider } from '@/server/ai/mockProvider';
import { prisma } from '@/server/db';
import { createReferral, listReferrals } from '@/server/services/partners';
import {
  ensureProposals,
  getProposal,
  listProposals,
  updateCard,
} from '@/server/services/proposals';

import { TODAY, decisionSummaries, resetDemo } from './helpers';

describe('F. florist channel', () => {
  beforeEach(() => resetDemo());

  it('F1 the sample order reads correctly with and without AI, and nothing is saved until the customer confirms', async () => {
    const text = sampleFloristOrder(TODAY);
    const counts = async () => [
      await prisma.account.count(),
      await prisma.person.count(),
      await prisma.referral.count(),
    ];
    const before = await counts();
    for (const provider of [new MockProvider(), null]) {
      const r = await runJob('read_florist_order', { text }, { provider });
      expect(r.result.recipient).toBe('Mrs J Sharma');
      expect(r.result.relationship).toBe('mother');
      expect(r.result.occasion).toBe('birthday');
      expect(r.result.age).toBe(70);
      expect(r.result.date).toBe(isoDate(addDays(TODAY, 19)));
    }
    expect(await counts()).toEqual(before);
    expect(await listReferrals()).toHaveLength(0);
  });

  it('F2 the ledger records 1.50 owed to the florist and 2.45 expected commission on a 35.00 basket', async () => {
    const reading = (
      await runJob('read_florist_order', { text: sampleFloristOrder(TODAY) }, { provider: null })
    ).result;
    const referral = await createReferral(reading, 'rule', TODAY);
    const ledger = referral.ledger as {
      referralFeePence: number;
      expectedCommissionPence: number;
      basketPence: number;
      freeFirstCard: boolean;
    };
    expect(ledger.referralFeePence).toBe(150);
    expect(ledger.expectedCommissionPence).toBe(245);
    expect(ledger.basketPence).toBe(3500);
    expect(ledger.freeFirstCard).toBe(true);
    const log = await decisionSummaries('referral');
    expect(log[0]).toContain('£1.50 owed');
    expect(log[0]).toContain('£2.45 commission');
  });

  it('F3 the referred customer gets a proposal that is a free first card once rule A8 holds', async () => {
    const reading = (
      await runJob('read_florist_order', { text: sampleFloristOrder(TODAY) }, { provider: null })
    ).result;
    const referral = await createReferral(reading, 'rule', TODAY);
    await ensureProposals(referral.accountId!, TODAY);
    const screen = await listProposals(referral.accountId!, TODAY);
    const proposal = screen.today.find((p) => p.person.name === 'Mrs J Sharma');
    expect(proposal).toBeDefined();
    expect(proposal!.quote.firstCardFree).toBe(false); // one reminder date so far
    await prisma.occasion.createMany({
      data: [
        { personId: referral.personId!, type: 'mothers_day' },
        { personId: referral.personId!, type: 'christmas' },
      ],
    });
    // The rules propose Large Luxe with flowers for a mother's 70th (B5); the free card is
    // Regular Classic or Signature only (A8), so the customer's Regular Signature choice is free.
    const stillPaid = (await getProposal(proposal!.key, TODAY))!;
    expect(stillPaid.card.size).toBe('large');
    expect(stillPaid.quote.firstCardFree).toBe(false);
    const free = (await updateCard(
      proposal!.key,
      { size: 'regular', finish: 'signature', gift: 'none' },
      TODAY,
    ))!;
    expect(free.quote.firstCardFree).toBe(true);
    expect(free.quote.cardPence).toBe(0);
    expect(free.quote.totalPence).toBe(free.quote.deliveryPence);
  });
});
