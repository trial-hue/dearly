import { beforeEach, describe, expect, it } from 'vitest';

import { RULES, STAMPS, addDays, daysBetween, startOfDay, toPence } from '@/domain';
import { prisma } from '@/server/db';
import { newSlug } from '@/server/ids';
import { SEED_SLUGS } from '@/server/seed/seedDemo';
import { sendEcard } from '@/server/services/ecards';
import { listInventory } from '@/server/services/inventory';
import { counters } from '@/server/services/operations';
import {
  advanceAll,
  delayOrder,
  getOrder,
  listOrders,
  printerScores,
  rateOrder,
  saveToInventory,
  sendOneBack,
} from '@/server/services/orders';
import {
  applyGuaranteeCode,
  approveProposal,
  ensureProposals,
  getProposal,
} from '@/server/services/proposals';

import { DEMO_ACCOUNT_ID, TODAY, decisionSummaries, resetDemo } from './helpers';

async function approve(key: string) {
  await ensureProposals(DEMO_ACCOUNT_ID, TODAY);
  const r = await approveProposal(key, DEMO_ACCOUNT_ID, TODAY);
  if (!r.ok) throw new Error(`approve failed: ${r.reason}`);
  return r.orderId;
}

async function advanceUntil(orderId: string, stage: string) {
  for (let i = 0; i < 8; i++) {
    const o = (await getOrder(orderId, TODAY))!;
    if (o.stage === stage) return o;
    await advanceAll(DEMO_ACCOUNT_ID, TODAY);
  }
  throw new Error(`never reached ${stage}`);
}

describe('C. guarantee and recovery', () => {
  beforeEach(() => resetDemo());

  it('C4 a delayed posted order with the guarantee gets the eCard, the full refund, a single-use 50% card-price code and a tracked reprint, each on the order and in the decision log', async () => {
    const view = (await delayOrder('ord_seed_priya', DEMO_ACCOUNT_ID, TODAY))!;
    expect(view.delayed).toBe(true);
    const types = view.recovery!.actions.map((a) => a.type);
    expect(types).toEqual(['ecard', 'refund', 'discount', 'reprint']);
    expect(view.recovery!.actions.find((a) => a.type === 'refund')!.pence).toBe(view.totalPence);
    expect(view.recovery!.actions.find((a) => a.type === 'discount')!.label).toMatch(
      /50% off the card price/,
    );
    expect(view.reprints).toBe(1);
    expect(await prisma.job.count({ where: { type: 'send_ecard' } })).toBe(1);
    const log = await decisionSummaries('recovery');
    expect(log.some((s) => s.startsWith('Refunded £3.94'))).toBe(true);
    expect(log.some((s) => s.includes('Tracked reprint'))).toBe(true);
    expect(log.some((s) => s.includes('eCard scheduled'))).toBe(true);
    expect(log.some((s) => s.includes('50% next-card code'))).toBe(true);
  });

  it('C4 the reprint is skipped when fewer than two days remain', async () => {
    const orderId = await approve('person_bill|birthday|2026'); // tracked, 3 days
    await advanceUntil(orderId, 'posted');
    const view = (await delayOrder(orderId, DEMO_ACCOUNT_ID, addDays(TODAY, 2)))!; // 1 day left
    expect(view.recovery!.actions.map((a) => a.type)).toEqual(['ecard', 'refund', 'discount']);
  });

  it('C5 a pick-up or eCard order never receives a guarantee refund', async () => {
    const pickupId = await approve('person_sam|leaving|2026');
    const pickup = (await getOrder(pickupId, TODAY))!;
    expect(pickup.mode).toBe('pickup');
    expect(pickup.guarantee).toBe(false);
    const delayed = await delayOrder(pickupId, DEMO_ACCOUNT_ID, TODAY);
    expect(delayed?.recovery?.actions.some((a) => a.type === 'refund') ?? false).toBe(false);
    const ecard = (await sendEcard(
      DEMO_ACCOUNT_ID,
      {
        personId: 'person_dan',
        occasion: 'birthday',
        message: 'Hi Dan',
        font: 'hand',
        design: 'balloons',
        animation: 'envelope',
        drawingMediaId: null,
        narrationMediaId: null,
        clipMediaId: null,
        wordTimings: [],
      },
      TODAY,
    ))!;
    const e = (await delayOrder(ecard.orderId, DEMO_ACCOUNT_ID, TODAY))!;
    expect(e.guarantee).toBe(false);
    expect(e.recovery).toBeNull();
    expect((await decisionSummaries('recovery')).some((s) => s.startsWith('Refunded'))).toBe(false);
  });

  it('C3 Operations reports the advance-post share and postage saved as advance orders × 0.89', async () => {
    await approve('person_dan|birthday|2026'); // advance
    await approve('person_bill|birthday|2026'); // tracked
    const c = await counters(DEMO_ACCOUNT_ID);
    const orders = await listOrders(DEMO_ACCOUNT_ID, TODAY);
    const printed = orders.filter((o) => o.mode !== 'ecard');
    const advance = printed.filter((o) => o.mode === 'advance');
    expect(c.printedOrders).toBe(printed.length);
    expect(c.advanceOrders).toBe(advance.length);
    expect(c.advanceShare).toBe(Math.round((advance.length / printed.length) * 100));
    expect(toPence(STAMPS.firstClass) - toPence(STAMPS.secondClass)).toBe(89);
    expect(c.postageSavedPence).toBe(advance.length * 89);
  });
});

describe('C6 the guarantee code', () => {
  beforeEach(() => resetDemo());

  it('halves the card price only, once, and cannot be reused', async () => {
    const delayed = (await delayOrder('ord_seed_priya', DEMO_ACCOUNT_ID, TODAY))!;
    const detail = delayed.recovery!.actions.find((a) => a.type === 'discount')!.detail ?? '';
    const code = /code\s+([A-Z0-9-]+)/i.exec(detail)![1]!;
    expect(code).toBe('DEARLY50-RIYA');
    await ensureProposals(DEMO_ACCOUNT_ID, TODAY);
    const full = (await getProposal('person_dan|birthday|2026', TODAY))!;
    const view = (await applyGuaranteeCode(
      'person_dan|birthday|2026',
      code.toLowerCase(),
      DEMO_ACCOUNT_ID,
      TODAY,
    ))!;
    expect(view.quote.discountPence).toBe(200);
    expect(view.quote.cardPence).toBe(full.quote.cardPence - 200);
    expect(view.quote.deliveryPence).toBe(full.quote.deliveryPence);
    expect(view.quote.totalPence).toBe(full.quote.totalPence - 200);
    const approved = await approveProposal('person_dan|birthday|2026', DEMO_ACCOUNT_ID, TODAY);
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: approved.orderId } })).totalPence,
    ).toBe(full.quote.totalPence - 200);
    await expect(
      applyGuaranteeCode('person_bill|birthday|2026', code, DEMO_ACCOUNT_ID, TODAY),
    ).rejects.toThrow(/already been used/);
    await expect(
      applyGuaranteeCode('person_bill|birthday|2026', 'DEARLY50-NOPE', DEMO_ACCOUNT_ID, TODAY),
    ).rejects.toThrow(/not one of ours/);
    expect((await decisionSummaries('recovery')).some((s) => s.includes('redeemed'))).toBe(true);
  });
});

describe('D. recipient loop and Inventory', () => {
  beforeEach(() => resetDemo());

  it('D1 every printed order has a unique slug of 22+ characters from a cryptographic source', async () => {
    await approve('person_dan|birthday|2026');
    await approve('person_bill|birthday|2026');
    const orders = await prisma.order.findMany({ where: { mode: { not: 'ecard' } } });
    const slugs = orders.map((o) => o.recipientSlug);
    for (const s of slugs) expect(s.length).toBeGreaterThanOrEqual(22);
    expect(new Set(slugs).size).toBe(slugs.length);
    const many = new Set(Array.from({ length: 5000 }, () => newSlug()));
    expect(many.size).toBe(5000);
    for (const s of many) expect(s).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it('D3 a rating moves the printer score, saving creates an account at acquisition cost 0, and "send one back" creates a reminder for the sender', async () => {
    const before = (await printerScores()).find((p) => p.id === 'mcr')!.blended;
    await rateOrder(SEED_SLUGS.danDelivered, 1, null);
    const after = (await printerScores()).find((p) => p.id === 'mcr')!.blended;
    expect(after).toBeLessThan(before);

    const accountsBefore = await prisma.account.count();
    expect(await saveToInventory(SEED_SLUGS.danDelivered)).not.toBeNull();
    expect(await prisma.account.count()).toBe(accountsBefore + 1);
    const joined = await prisma.account.findFirst({
      where: { name: 'Dan Okafor' },
      include: { inventory: true },
    });
    expect(joined).not.toBeNull();
    expect(
      joined!.inventory.some((i) => i.direction === 'received' && i.orderId === 'ord_seed_dan'),
    ).toBe(true);
    expect((await decisionSummaries('growth')).some((s) => /no acquisition cost/.test(s))).toBe(
      true,
    );

    const key = await sendOneBack(SEED_SLUGS.danDelivered, TODAY);
    expect(key).toMatch(/\|back\|/);
    const proposal = await prisma.proposal.findUniqueOrThrow({ where: { key: key! } });
    expect(proposal.personId).toBe('person_dan');
    expect(daysBetween(startOfDay(TODAY), startOfDay(proposal.dueDate))).toBe(7);
  });

  it('D4 no marketing consent is recorded for a recipient who saves a card', async () => {
    await saveToInventory(SEED_SLUGS.danDelivered);
    const joined = await prisma.account.findFirst({ where: { name: 'Dan Okafor' } });
    const consents = (joined?.consents ?? {}) as Record<string, unknown>;
    expect(consents.marketing ?? false).toBe(false);
  });

  it('D5 the Inventory keeps sent and received cards for three years and warns 20 days before expiry', async () => {
    const inv = await listInventory(DEMO_ACCOUNT_ID, TODAY);
    expect(inv.received.length).toBeGreaterThanOrEqual(3);
    expect(inv.sent.length).toBeGreaterThanOrEqual(1);
    for (const item of [...inv.received, ...inv.sent]) {
      const kept = daysBetween(startOfDay(item.receivedAt), startOfDay(item.keptUntil));
      expect(kept).toBeGreaterThanOrEqual(365 * RULES.inventoryYears - 2);
      expect(kept).toBeLessThanOrEqual(366 * RULES.inventoryYears);
      expect(item.warn).toBe(item.daysLeft <= 20);
    }
    expect(inv.received.some((i) => i.warn)).toBe(true);
    expect(
      inv.received.filter((i) => i.warn).every((i) => i.daysLeft <= 20 && i.daysLeft > 0),
    ).toBe(true);
  });
});
