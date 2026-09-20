import { beforeEach, describe, expect, it } from 'vitest';

import { RULES, addDays, isoDate, quote } from '@/domain';
import { prisma } from '@/server/db';
import { advanceAll, listOrders } from '@/server/services/orders';
import { confirmAddress, pausePerson } from '@/server/services/people';
import {
  approveProposal,
  ensureProposals,
  firstCardFreeFor,
  getProposal,
  listProposals,
  skipProposal,
  updateCard,
} from '@/server/services/proposals';

import { DEMO_ACCOUNT_ID, TODAY, decisionSummaries, resetDemo } from './helpers';

const DAN = 'person_dan|birthday|2026';
const BILL = 'person_bill|birthday|2026';
const PRIYA = 'person_priya|anniversary|2026';

async function freshAccount(reminderDates: number) {
  const account = await prisma.account.create({
    data: { name: 'Nia Test', email: `nia-${Date.now()}@referral.dearly.invalid` },
  });
  const person = await prisma.person.create({
    data: {
      accountId: account.id,
      name: 'Ola Test',
      relationship: 'friend',
      postcode: 'M1 1AE',
      addrCheckedAt: TODAY,
      occasions: {
        create: Array.from({ length: reminderDates }, (_, i) => ({
          type: i === 0 ? 'birthday' : 'thank_you',
          monthDay: i === 0 ? isoDate(addDays(TODAY, 12)).slice(5) : null,
          adhocDate: i === 0 ? null : isoDate(addDays(TODAY, 40 + i)),
        })),
      },
    },
  });
  return { account, person };
}

describe('B. the proposal engine', () => {
  beforeEach(() => resetDemo());

  it('B1 proposes every active person with an occasion inside 35 days, fully filled in, and nothing for paused people', async () => {
    const screen = await listProposals(DEMO_ACCOUNT_ID, TODAY);
    const byPerson = Object.fromEntries(screen.today.map((p) => [p.personId, p]));
    for (const id of [
      'person_sam',
      'person_bill',
      'person_dan',
      'person_margaret',
      'person_priya',
    ]) {
      const p = byPerson[id];
      expect(p, id).toBeDefined();
      expect(p!.daysLeft).toBeLessThanOrEqual(RULES.proposalWindowDays);
      expect(p!.daysLeft).toBeGreaterThanOrEqual(0);
      expect(p!.status).toBe('proposed');
      expect(p!.card.design).toBeTruthy();
      expect(p!.card.message.length).toBeGreaterThan(10);
      expect(p!.card.size).toBeTruthy();
      expect(p!.card.finish).toBeTruthy();
      expect(p!.card.mode).toBeTruthy();
      expect(p!.quote.totalPence).toBeGreaterThan(0);
      expect(p!.quote.totalPence).toBe(quote(p!.card).totalPence);
    }
    expect(byPerson.person_peter).toBeUndefined(); // paused
    for (const p of screen.today) expect(p.daysLeft).toBeLessThanOrEqual(RULES.proposalWindowDays);
    // Created at least 21 days ahead: an occasion 24 days out (Priya) already has its proposal.
    expect(byPerson.person_priya!.daysLeft).toBeGreaterThanOrEqual(21); // the model's 21 days
    const rows = await prisma.proposal.findMany({ where: { status: 'proposed' } });
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('B2 one action approves and pays, and the order stores the quote that was displayed', async () => {
    await ensureProposals(DEMO_ACCOUNT_ID, TODAY);
    const shown = (await getProposal(DAN, TODAY))!;
    const result = await approveProposal(DAN, DEMO_ACCOUNT_ID, TODAY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId } });
    expect(order.totalPence).toBe(shown.quote.totalPence);
    expect(order.quote).toEqual(JSON.parse(JSON.stringify(shown.quote)));
    expect(order.stage).toBe('checked');
    const summaries = await decisionSummaries('payment');
    expect(summaries.some((s) => s.includes('Payment of £4.94 captured'))).toBe(true);
    expect((await getProposal(DAN, TODAY))!.status).toBe('approved');
  });

  it('B3 a paused person gets no proposal, an open proposal is withdrawn on pause, and their card is held at print time', async () => {
    await ensureProposals(DEMO_ACCOUNT_ID, TODAY);
    expect(await prisma.proposal.count({ where: { personId: 'person_peter' } })).toBe(0);
    expect((await getProposal(BILL, TODAY))!.status).toBe('proposed');
    await pausePerson('person_bill', 'bereavement', 'person', TODAY);
    expect((await prisma.proposal.findUniqueOrThrow({ where: { key: BILL } })).status).toBe(
      'withdrawn',
    );
    await ensureProposals(DEMO_ACCOUNT_ID, TODAY);
    expect(
      await prisma.proposal.count({ where: { personId: 'person_bill', status: 'proposed' } }),
    ).toBe(0);
    expect((await approveProposal(BILL, DEMO_ACCOUNT_ID, TODAY)).ok).toBe(false);

    // Print time: an order already placed for a person who is then paused does not move on.
    const approved = await approveProposal(DAN, DEMO_ACCOUNT_ID, TODAY);
    expect(approved.ok).toBe(true);
    await pausePerson('person_dan', 'bereavement', 'person', TODAY);
    await advanceAll(DEMO_ACCOUNT_ID, TODAY);
    const dan = (await listOrders(DEMO_ACCOUNT_ID, TODAY)).find(
      (o) => o.personId === 'person_dan' && o.stage !== 'delivered',
    )!;
    expect(dan.stage).toBe('checked');
    const held = await decisionSummaries('fulfilment');
    expect(held.some((s) => /held|paused/i.test(s) && s.includes('Dan'))).toBe(true);
  });

  it('B4 an address not confirmed for 365 days blocks approval until it is confirmed', async () => {
    await ensureProposals(DEMO_ACCOUNT_ID, TODAY);
    const before = (await getProposal(PRIYA, TODAY))!;
    expect(before.person.stale).toBe(true);
    expect(before.approvable).toBe(false);
    expect(before.blockReason).toBe('address_stale');
    const blocked = await approveProposal(PRIYA, DEMO_ACCOUNT_ID, TODAY);
    expect(blocked).toEqual({ ok: false, reason: 'address_stale' });
    await confirmAddress('person_priya', TODAY);
    expect((await getProposal(PRIYA, TODAY))!.approvable).toBe(true);
    expect((await approveProposal(PRIYA, DEMO_ACCOUNT_ID, TODAY)).ok).toBe(true);
  });

  it('B7 skipping suppresses the proposal for that year only', async () => {
    await ensureProposals(DEMO_ACCOUNT_ID, TODAY);
    expect(await skipProposal(DAN)).toBe(true);
    expect((await prisma.proposal.findUniqueOrThrow({ where: { key: DAN } })).status).toBe(
      'skipped',
    );
    await ensureProposals(DEMO_ACCOUNT_ID, TODAY);
    expect(
      await prisma.proposal.count({
        where: { personId: 'person_dan', occasion: { type: 'birthday' } },
      }),
    ).toBe(1);
    // A year on, the same occasion is proposed again under next year's key.
    const nextYear = addDays(TODAY, 365 - 20);
    await ensureProposals(DEMO_ACCOUNT_ID, nextYear);
    const keys = (await prisma.proposal.findMany({ where: { personId: 'person_dan' } })).map(
      (p) => p.key,
    );
    expect(keys).toContain('person_dan|birthday|2027');
    expect(
      (await prisma.proposal.findUniqueOrThrow({ where: { key: 'person_dan|birthday|2027' } }))
        .status,
    ).toBe('proposed');
  });
});

describe('A8 first card free', () => {
  beforeEach(() => resetDemo());

  it('applies once, for Regular Classic or Signature, only with three or more reminder dates, delivery still charged, and a second attempt is refused', async () => {
    const one = await freshAccount(1);
    await ensureProposals(one.account.id, TODAY);
    const notYet = (await listProposals(one.account.id, TODAY)).today[0]!;
    expect(notYet.quote.firstCardFree).toBe(false);
    expect(await firstCardFreeFor(one.account.id)).toBe(false);

    const three = await freshAccount(3);
    await ensureProposals(three.account.id, TODAY);
    const free = (await listProposals(three.account.id, TODAY)).today[0]!;
    expect(free.card.size).toBe('regular');
    expect(free.quote.firstCardFree).toBe(true);
    expect(free.quote.cardPence).toBe(0);
    expect(free.quote.deliveryPence).toBeGreaterThan(0);
    expect(free.quote.totalPence).toBe(free.quote.deliveryPence);
    // Luxe is never free.
    const luxe = (await updateCard(free.key, { finish: 'luxe' }, TODAY))!;
    expect(luxe.quote.firstCardFree).toBe(false);
    expect(luxe.quote.cardPence).toBeGreaterThan(0);
    await updateCard(free.key, { finish: 'signature' }, TODAY);
    const approved = await approveProposal(free.key, three.account.id, TODAY);
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    const order = await prisma.order.findUniqueOrThrow({ where: { id: approved.orderId } });
    expect(order.totalPence).toBe(free.quote.deliveryPence);

    // A second card on the same account is charged in full.
    expect(await firstCardFreeFor(three.account.id)).toBe(false);
    const second = await prisma.proposal.findFirst({
      where: { person: { accountId: three.account.id }, status: 'proposed' },
    });
    expect(second).not.toBeNull();
    const view = (await getProposal(second!.key, TODAY))!;
    expect(view.quote.firstCardFree).toBe(false);
    expect(view.quote.cardPence).toBeGreaterThan(0);
  });

  it('cannot be forced from the client: the flag is not a card field', async () => {
    await ensureProposals(DEMO_ACCOUNT_ID, TODAY);
    const view = (await updateCard(DAN, { firstCardFree: true } as never, TODAY))!;
    expect(view.quote.firstCardFree).toBe(false);
    expect(view.quote.cardPence).toBe(399);
  });
});
