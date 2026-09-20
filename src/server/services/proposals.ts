import type { Person, Proposal } from '@prisma/client';

import {
  CardSpecSchema,
  TITLES,
  addDays,
  addressIsStale,
  allowedModes,
  arrivalDate,
  bucketFor,
  canApprove,
  chooseMode,
  daysBetween,
  defaultProposal,
  firstCardFreeEligible,
  formatPence,
  isOccasionType,
  isoDate,
  messageFor,
  nextDate,
  parseIsoDate,
  proposalsDue,
  quote,
  route,
  startOfDay,
  templateCount,
  yearsAt,
  type CardSpec,
  type Costs,
  type OccasionType,
  type ProposalBucket,
  type Quote,
} from '@/domain';
import { getPayments } from '@/server/adapters/payments';
import { prisma } from '@/server/db';
import { newSlug } from '@/server/ids';
import { json } from '@/server/json';

import * as decisions from './decisionLog';
import { toOccasionLike } from './people';
import { getSettings } from './settings';

export const SENDER = 'Alex';

export function parseCard(value: unknown): CardSpec {
  return CardSpecSchema.parse(value) as CardSpec;
}

type ProposalRow = Proposal & { person: Person; orders?: { id: string }[] };

/**
 * First card free (once per account): no printed card ordered yet and at least three reminder
 * dates among active people. The size and finish rule is applied inside quote().
 */
export async function firstCardFreeFor(accountId: string): Promise<boolean> {
  const [printedOrders, reminderDates] = await Promise.all([
    prisma.order.count({ where: { accountId, mode: { not: 'ecard' } } }),
    prisma.occasion.count({ where: { person: { accountId, pausedReason: null } } }),
  ]);
  return firstCardFreeEligible({ printedOrders, reminderDates });
}

export interface ProposalView {
  id: string;
  key: string;
  status: string;
  personId: string;
  person: {
    id: string;
    name: string;
    relationship: string;
    postcode: string | null;
    stale: boolean;
    paused: boolean;
  };
  occasionType: OccasionType;
  title: string;
  dueDate: Date;
  daysLeft: number;
  age: number | null;
  card: CardSpec;
  quote: Quote;
  arrival: Date;
  bucket: ProposalBucket;
  madeBy: string;
  messageBy: string;
  aiReason: string | null;
  flags: string[];
  allowedModes: string[];
  approvable: boolean;
  blockReason: 'address_stale' | null;
  orderId: string | null;
}

export function toView(
  row: ProposalRow,
  today: Date,
  costs: Costs,
  firstCardFree = false,
): ProposalView {
  const card = parseCard(row.cardSpec);
  const type = keyType(row.key);
  const dueDate = startOfDay(row.dueDate);
  const daysLeft = daysBetween(startOfDay(today), dueDate);
  const check = canApprove(row.person, today, card.mode);
  const flags = Array.isArray(row.flags) ? (row.flags as string[]) : [];
  return {
    id: row.id,
    key: row.key,
    status: row.status,
    personId: row.personId,
    person: {
      id: row.person.id,
      name: row.person.name,
      relationship: row.person.relationship,
      postcode: row.person.postcode,
      stale: addressIsStale(row.person, today),
      paused: Boolean(row.person.pausedReason),
    },
    occasionType: type,
    title: TITLES[type],
    dueDate,
    daysLeft,
    age: null,
    card,
    quote: quote({ ...card, firstCardFree }, costs),
    arrival: arrivalDate(card.mode, card.size, dueDate, today),
    bucket: bucketFor(daysLeft),
    madeBy: row.madeBy,
    messageBy: row.messageBy,
    aiReason: row.aiReason,
    flags,
    allowedModes: allowedModes(card.size, card.finish),
    approvable: row.status === 'proposed' && check.ok,
    blockReason: check.ok ? null : check.reason,
    orderId: row.orders?.[0]?.id ?? null,
  };
}

// The occasion type is the middle segment of the key: personId|type|year.
function keyType(key: string): OccasionType {
  const t = key.split('|')[1] ?? 'birthday';
  return isOccasionType(t) ? t : 'birthday';
}

/** Create any proposal that the reminder rules say is due and does not exist yet. */
export async function ensureProposals(accountId: string, today: Date): Promise<number> {
  const people = await prisma.person.findMany({
    where: { accountId },
    include: { occasions: true },
  });
  const existing = await prisma.proposal.findMany({
    where: { person: { accountId } },
    select: { key: true },
  });
  const drafts = proposalsDue(
    people.map((p) => ({ ...p, occasions: p.occasions.map(toOccasionLike) })),
    new Set(existing.map((e) => e.key)),
    today,
    SENDER,
  );
  if (drafts.length === 0) return 0;
  await prisma.proposal.createMany({
    data: drafts.map((d) => ({
      key: d.key,
      personId: d.personId,
      occasionId: d.occasionId,
      status: 'proposed',
      cardSpec: json(d.card),
      aiReason: d.reason,
      madeBy: 'rule',
      messageBy: 'rule',
      flags: json(d.flags),
      dueDate: d.dueDate,
    })),
    skipDuplicates: true,
  });
  await decisions.record({
    actor: 'rule',
    job: 'proposals',
    summary: `Created ${drafts.length} ${drafts.length === 1 ? 'proposal' : 'proposals'} from the reminder rules`,
  });
  return drafts.length;
}

async function withAges(views: ProposalView[]): Promise<ProposalView[]> {
  const ids = [...new Set(views.map((v) => v.personId))];
  const occasions = await prisma.occasion.findMany({ where: { personId: { in: ids } } });
  return views.map((v) => {
    const occ = occasions.find((o) => o.personId === v.personId && o.type === v.occasionType);
    return { ...v, age: occ ? yearsAt(occ.startYear, v.dueDate) : null };
  });
}

export interface TodayScreen {
  today: ProposalView[];
  later: ProposalView[];
  approved: ProposalView[];
  skippedCount: number;
  paused: { id: string; name: string; reason: string; since: Date | null }[];
  beyond: {
    personId: string;
    name: string;
    occasionType: OccasionType;
    date: Date;
    daysLeft: number;
  }[];
  people: { id: string; name: string }[];
}

export async function listProposals(accountId: string, today: Date): Promise<TodayScreen> {
  await ensureProposals(accountId, today);
  const { costs } = await getSettings();
  const rows = await prisma.proposal.findMany({
    where: { person: { accountId } },
    include: { person: true, orders: { select: { id: true } } },
    orderBy: { dueDate: 'asc' },
  });
  const free = await firstCardFreeFor(accountId);
  const views = await withAges(rows.map((r) => toView(r, today, costs, free)));
  const people = await prisma.person.findMany({
    where: { accountId },
    include: { occasions: true },
    orderBy: { name: 'asc' },
  });
  const beyond: TodayScreen['beyond'] = [];
  for (const p of people) {
    if (p.pausedReason) continue;
    for (const o of p.occasions) {
      const due = nextDate(toOccasionLike(o), today);
      if (!due) continue;
      const daysLeft = daysBetween(startOfDay(today), due);
      if (daysLeft > 150)
        beyond.push({
          personId: p.id,
          name: p.name,
          occasionType: toOccasionLike(o).type,
          date: due,
          daysLeft,
        });
    }
  }
  return {
    today: views.filter((v) => v.status === 'proposed' && v.bucket === 'today'),
    later: views.filter((v) => v.status === 'proposed' && v.bucket === 'later'),
    approved: views
      .filter((v) => v.status === 'approved')
      .slice(-8)
      .reverse(),
    skippedCount: views.filter((v) => v.status === 'skipped').length,
    paused: people
      .filter((p) => p.pausedReason)
      .map((p) => ({ id: p.id, name: p.name, reason: p.pausedReason ?? '', since: p.pausedAt })),
    beyond: beyond.sort((a, b) => a.daysLeft - b.daysLeft),
    people: people.filter((p) => !p.pausedReason).map((p) => ({ id: p.id, name: p.name })),
  };
}

export async function getProposal(key: string, today: Date): Promise<ProposalView | null> {
  const row = await prisma.proposal.findUnique({
    where: { key },
    include: { person: true, orders: { select: { id: true } } },
  });
  if (!row) return null;
  const { costs } = await getSettings();
  const [view] = await withAges([
    toView(row, today, costs, await firstCardFreeFor(row.person.accountId)),
  ]);
  return view ?? null;
}

const CardPatchSchema = CardSpecSchema.partial();

/** Edit the card. Mode follows the size unless the customer overrode it; Giant is always tracked. */
export async function updateCard(
  key: string,
  patch: unknown,
  today: Date,
): Promise<ProposalView | null> {
  const row = await prisma.proposal.findUnique({ where: { key }, include: { person: true } });
  if (!row) return null;
  // zod's partial() still fills in field defaults for absent keys; keep only what was sent (ADR 0006).
  const validated = CardPatchSchema.parse(patch);
  const sent =
    patch && typeof patch === 'object' ? new Set(Object.keys(patch as object)) : new Set<string>();
  const parsed = Object.fromEntries(
    Object.entries(validated).filter(([k]) => sent.has(k)),
  ) as typeof validated;
  const card = parseCard(row.cardSpec);
  const daysLeft = daysBetween(startOfDay(today), startOfDay(row.dueDate));
  const next: CardSpec = { ...card, ...(parsed as Partial<CardSpec>) };
  if (parsed.mode && parsed.mode !== card.mode)
    next.modeOverridden = parsed.mode !== 'ecard' ? true : card.modeOverridden;
  if (next.mode !== 'ecard') {
    const sizeOrFinishChanged =
      (parsed.size != null && parsed.size !== card.size) ||
      (parsed.finish != null && parsed.finish !== card.finish);
    if (sizeOrFinishChanged && !next.modeOverridden)
      next.mode = chooseMode(next.size, daysLeft, next.finish);
    if (next.size === 'giant') next.mode = 'tracked';
    if (!allowedModes(next.size, next.finish).includes(next.mode as 'advance'))
      next.mode = chooseMode(next.size, daysLeft, next.finish);
  }
  if (parsed.message !== undefined && parsed.message !== card.message) {
    await prisma.proposal.update({ where: { key }, data: { messageBy: 'person' } });
  }
  const updated = await prisma.proposal.update({
    where: { key },
    data: {
      cardSpec: json(next),
      ...(parsed.size || parsed.finish || parsed.gift ? { madeBy: 'person' } : {}),
    },
    include: { person: true, orders: { select: { id: true } } },
  });
  const { costs } = await getSettings();
  const [view] = await withAges([
    toView(updated, today, costs, await firstCardFreeFor(updated.person.accountId)),
  ]);
  return view ?? null;
}

/** Rotate to the next fallback template ("Rewrite" without AI). */
export async function rewriteWithRules(key: string, today: Date): Promise<ProposalView | null> {
  const view = await getProposal(key, today);
  if (!view) return null;
  const count = templateCount(view.occasionType, view.age);
  const ctx = {
    name: view.person.name,
    age: view.age,
    relationship: view.person.relationship,
    sender: SENDER,
  };
  let variant = 0;
  for (let i = 0; i < count; i++) {
    if (messageFor(view.occasionType, ctx, i) === view.card.message) variant = (i + 1) % count;
  }
  const message = messageFor(view.occasionType, ctx, variant);
  await prisma.proposal.update({
    where: { key },
    data: { cardSpec: json({ ...view.card, message }), messageBy: 'rule' },
  });
  await decisions.record({
    actor: 'rule',
    job: 'rewrite_message',
    summary: `Rewrote the message for ${view.person.name} from the built-in templates`,
  });
  return getProposal(key, today);
}

export type ApproveResult =
  | { ok: true; orderId: string; slug: string }
  | { ok: false; reason: 'not_found' | 'not_proposed' | 'address_stale' | 'paused' };

/** Approve and pay: creates the order, routes it, captures payment (simulated) and logs each step. */
export async function approveProposal(
  key: string,
  accountId: string,
  today: Date,
): Promise<ApproveResult> {
  const row = await prisma.proposal.findUnique({ where: { key }, include: { person: true } });
  if (!row || row.person.accountId !== accountId) return { ok: false, reason: 'not_found' };
  if (row.status !== 'proposed') return { ok: false, reason: 'not_proposed' };
  if (row.person.pausedReason) return { ok: false, reason: 'paused' };
  const card = parseCard(row.cardSpec);
  const check = canApprove(row.person, today, card.mode);
  if (!check.ok) return { ok: false, reason: check.reason };

  const { costs } = await getSettings();
  const q = quote({ ...card, firstCardFree: await firstCardFreeFor(accountId) }, costs);
  const type = keyType(row.key);
  const dueDate = startOfDay(row.dueDate);
  const promised = arrivalDate(card.mode, card.size, dueDate, today);
  const printers = await prisma.printer.findMany();
  const printer =
    card.mode === 'ecard'
      ? null
      : route(row.person.postcode ?? '', card.size, card.finish, printers);
  const payments = getPayments();
  const auth = await payments.authorise(q.totalPence, key);
  const payment = await payments.capture(auth.authId, q.totalPence);
  const slug = newSlug();
  const now = new Date();

  const order = await prisma.order.create({
    data: {
      accountId,
      proposalId: row.id,
      personId: row.personId,
      recipientName: row.person.name,
      occasionType: type,
      occasionDate: dueDate,
      cardSpec: json(card),
      quote: json(q),
      totalPence: q.totalPence,
      mode: card.mode,
      promisedDate: promised,
      guarantee: q.guarantee,
      stage: card.mode === 'ecard' ? 'delivered' : 'checked',
      stageHistory: json([
        { stage: card.mode === 'ecard' ? 'delivered' : 'checked', at: now.toISOString() },
      ]),
      printerId: printer?.id ?? null,
      recipientSlug: slug,
      ...(printer ? { shipments: { create: { printerId: printer.id, kind: 'first' } } } : {}),
      ...(card.mode === 'ecard'
        ? {
            digitalCard: { create: { slug, animation: 'envelope' } },
            inventory: {
              create: {
                accountId,
                direction: 'sent',
                fromName: SENDER,
                toName: row.person.name,
                occasionType: type,
                design: card.design,
                message: card.message,
                receivedAt: now,
                keptUntil: addDays(now, 365 * 3),
                cardSpec: json(card),
              },
            },
          }
        : {}),
    },
  });
  await prisma.proposal.update({ where: { key }, data: { status: 'approved' } });

  const modeLabel =
    card.mode === 'ecard'
      ? 'eCard'
      : `${card.size} ${card.finish} by ${card.mode === 'pickup' ? 'pick-up' : card.mode === 'advance' ? 'advance post' : 'tracked post'}`;
  await decisions.recordMany([
    {
      actor: 'person',
      job: 'approve',
      summary: `Approved ${row.person.name}'s ${TITLES[type].toLowerCase()} card: ${modeLabel}, ${formatPence(q.totalPence)}`,
      orderId: order.id,
    },
    {
      actor: 'rule',
      job: 'payment',
      summary: `Payment of ${formatPence(q.totalPence)} captured (${payment.paymentId}, simulated)`,
      orderId: order.id,
    },
    ...(printer
      ? [
          {
            actor: 'rule' as const,
            job: 'route',
            summary: `Routed to ${printer.name} (${printer.city}, score ${printer.score}) for ${row.person.postcode ?? 'an unknown area'}`,
            orderId: order.id,
          },
        ]
      : [
          {
            actor: 'rule' as const,
            job: 'ecard',
            summary: `eCard delivered by link to ${row.person.name}`,
            orderId: order.id,
          },
        ]),
    ...(q.guarantee
      ? [
          {
            actor: 'rule' as const,
            job: 'guarantee',
            summary: `Delivery guarantee attached; arrival promised for ${isoDate(promised)}`,
            orderId: order.id,
          },
        ]
      : []),
  ]);
  return { ok: true, orderId: order.id, slug };
}

export async function skipProposal(key: string): Promise<boolean> {
  const row = await prisma.proposal.findUnique({ where: { key }, include: { person: true } });
  if (!row || row.status !== 'proposed') return false;
  await prisma.proposal.update({ where: { key }, data: { status: 'skipped' } });
  await decisions.record({
    actor: 'person',
    job: 'skip',
    summary: `Skipped ${row.person.name}'s ${TITLES[keyType(key)].toLowerCase()} card this year`,
  });
  return true;
}

/** "New card": an ad hoc occasion for a person on a date, with a rules-based proposal. */
export async function createAdhocProposal(
  accountId: string,
  input: { personId: string; type: OccasionType; date: string },
  today: Date,
): Promise<ProposalView | null> {
  const person = await prisma.person.findFirst({ where: { id: input.personId, accountId } });
  if (!person) return null;
  const occasion = await prisma.occasion.create({
    data: { personId: person.id, type: input.type, adhocDate: input.date },
  });
  const draft = defaultProposal({
    person,
    occasion: toOccasionLike(occasion),
    today,
    sender: SENDER,
  });
  if (!draft) return null;
  const existing = await prisma.proposal.findUnique({ where: { key: draft.key } });
  if (existing) {
    // The customer asked for this date: move the existing proposal rather than ignoring it (ADR 0005).
    await prisma.occasion.delete({ where: { id: occasion.id } });
    if (existing.status !== 'proposed')
      await prisma.proposal.update({ where: { key: draft.key }, data: { status: 'proposed' } });
    return setProposalDate(draft.key, input.date, today);
  }
  await prisma.proposal.create({
    data: {
      key: draft.key,
      personId: person.id,
      occasionId: occasion.id,
      status: 'proposed',
      cardSpec: json(draft.card),
      aiReason: draft.reason,
      flags: json(draft.flags),
      dueDate: draft.dueDate,
    },
  });
  await decisions.record({
    actor: 'person',
    job: 'new_card',
    summary: `Added a ${TITLES[input.type].toLowerCase()} card for ${person.name} on ${input.date}`,
  });
  return getProposal(draft.key, today);
}

/**
 * Move a proposal to a date the customer chose. The delivery rule is re-applied unless the
 * customer overrode the mode; an ad hoc occasion moves with it; past dates are rejected (ADR 0005).
 */
export async function setProposalDate(
  key: string,
  date: string,
  today: Date,
): Promise<ProposalView | null> {
  const row = await prisma.proposal.findUnique({
    where: { key },
    include: { person: true, occasion: true },
  });
  if (!row || row.status !== 'proposed') return null;
  const due = parseIsoDate(date);
  if (!due) throw new Error('Choose a date as YYYY-MM-DD');
  const daysLeft = daysBetween(startOfDay(today), due);
  if (daysLeft < 0) throw new Error('That date has passed. Choose today or later.');
  const card = parseCard(row.cardSpec);
  const next: CardSpec = { ...card };
  if (next.mode !== 'ecard') {
    if (!next.modeOverridden) next.mode = chooseMode(next.size, daysLeft, next.finish);
    if (next.size === 'giant') next.mode = 'tracked';
    if (!allowedModes(next.size, next.finish).includes(next.mode as 'advance'))
      next.mode = chooseMode(next.size, daysLeft, next.finish);
  }
  if (row.occasion.adhocDate)
    await prisma.occasion.update({ where: { id: row.occasionId }, data: { adhocDate: date } });
  await prisma.proposal.update({ where: { key }, data: { dueDate: due, cardSpec: json(next) } });
  await decisions.record({
    actor: 'person',
    job: 'date',
    summary: `Moved ${row.person.name}'s ${TITLES[keyType(key)].toLowerCase()} card to ${date}`,
  });
  return getProposal(key, today);
}

/** Open proposals for the AI drafting job, with only the fields the job needs. */
export async function openProposalsForAi(accountId: string, today: Date) {
  const { costs } = await getSettings();
  const rows = await prisma.proposal.findMany({
    where: { person: { accountId }, status: 'proposed' },
    include: { person: true },
    orderBy: { dueDate: 'asc' },
  });
  const free = await firstCardFreeFor(accountId);
  const views = await withAges(rows.map((r) => toView(r, today, costs, free)));
  const pastMessages = await prisma.order.findMany({
    where: { accountId },
    select: { personId: true, cardSpec: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return views.map((v) => ({
    key: v.key,
    firstName: v.person.name,
    relationship: v.person.relationship,
    occasion: v.occasionType,
    date: isoDate(v.dueDate),
    daysLeft: v.daysLeft,
    age: v.age,
    milestone: v.flags.includes('milestone'),
    current: {
      design: v.card.design,
      size: v.card.size,
      finish: v.card.finish,
      gift: v.card.gift,
      message: v.card.message,
    },
    pastMessages: pastMessages
      .filter((o) => o.personId === v.personId)
      .map((o) => parseCard(o.cardSpec).message)
      .slice(0, 3),
  }));
}

export async function applyAiProposal(
  key: string,
  patch: {
    message: string;
    design: CardSpec['design'];
    size: CardSpec['size'];
    finish: CardSpec['finish'];
    gift: CardSpec['gift'];
    reason: string;
  },
  today: Date,
): Promise<void> {
  const row = await prisma.proposal.findUnique({ where: { key } });
  if (!row || row.status !== 'proposed') return;
  const card = parseCard(row.cardSpec);
  const daysLeft = daysBetween(startOfDay(today), startOfDay(row.dueDate));
  const next: CardSpec = {
    ...card,
    message: patch.message,
    design: patch.design,
    size: patch.size,
    finish: patch.finish,
    gift: patch.gift,
  };
  if (!next.modeOverridden) next.mode = chooseMode(next.size, daysLeft, next.finish);
  if (next.size === 'giant') next.mode = 'tracked';
  if (!allowedModes(next.size, next.finish).includes(next.mode as 'advance'))
    next.mode = chooseMode(next.size, daysLeft, next.finish);
  await prisma.proposal.update({
    where: { key },
    data: { cardSpec: json(next), madeBy: 'ai', messageBy: 'ai', aiReason: patch.reason },
  });
}
