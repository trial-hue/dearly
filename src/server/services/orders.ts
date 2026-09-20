import type { Prisma } from '@prisma/client';

import {
  RULES,
  STAGE_LABELS,
  TITLES,
  addDays,
  addYears,
  arrivalDate,
  blendedScore,
  daysBetween,
  defaultProposal,
  formatPence,
  isLate,
  isTerminal,
  isoDate,
  nextStage,
  planRecovery,
  recoveryCostPence,
  stagesFor,
  startOfDay,
  type AgentAction,
  type AgentOrderView,
  type CardSpec,
  type Mode,
  type OccasionType,
  type Quote,
  type RecoveryAction,
  type Stage,
} from '@/domain';
import { getCarrier } from '@/server/adapters/carriers';
import { getPayments } from '@/server/adapters/payments';
import { getPrinters } from '@/server/adapters/printers';
import { prisma } from '@/server/db';
import { json } from '@/server/json';

import * as decisions from './decisionLog';
import { toOccasionLike } from './people';
import { SENDER, parseCard } from './proposals';

const orderInclude = {
  printer: true,
  recovery: true,
  rating: true,
  digitalCard: true,
  person: { select: { id: true, name: true, postcode: true, pausedReason: true } },
  shipments: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export interface StageEvent {
  stage: Stage;
  at: string;
}

export interface OrderView {
  id: string;
  recipientName: string;
  personId: string | null;
  occasionType: OccasionType;
  title: string;
  occasionDate: Date;
  promisedDate: Date;
  mode: Mode;
  stage: Stage;
  stages: readonly Stage[];
  stageLabel: string;
  history: StageEvent[];
  card: CardSpec;
  quote: Quote;
  totalPence: number;
  guarantee: boolean;
  delayed: boolean;
  late: boolean;
  terminal: boolean;
  printer: { id: string; name: string; city: string } | null;
  recovery: { actions: RecoveryAction[]; costPence: number; at: Date } | null;
  rating: { stars: number; comment: string | null } | null;
  slug: string;
  recipientPath: string;
  hasDigitalCard: boolean;
  createdAt: Date;
  reprints: number;
}

export function toOrderView(row: OrderRow, today: Date): OrderView {
  const card = parseCard(row.cardSpec);
  const stage = row.stage as Stage;
  const mode = row.mode as Mode;
  return {
    id: row.id,
    recipientName: row.recipientName,
    personId: row.personId,
    occasionType: row.occasionType as OccasionType,
    title: TITLES[row.occasionType as OccasionType] ?? row.occasionType,
    occasionDate: row.occasionDate,
    promisedDate: row.promisedDate,
    mode,
    stage,
    stages: stagesFor(mode),
    stageLabel: STAGE_LABELS[stage] ?? stage,
    history: (Array.isArray(row.stageHistory) ? row.stageHistory : []) as unknown as StageEvent[],
    card,
    quote: row.quote as unknown as Quote,
    totalPence: row.totalPence,
    guarantee: row.guarantee,
    delayed: row.delayed,
    late: isLate({ stage, promisedDate: row.promisedDate, delayed: row.delayed }, today),
    terminal: isTerminal(stage),
    printer: row.printer
      ? { id: row.printer.id, name: row.printer.name, city: row.printer.city }
      : null,
    recovery: row.recovery
      ? {
          actions: row.recovery.actions as unknown as RecoveryAction[],
          costPence: row.recovery.costPence,
          at: row.recovery.createdAt,
        }
      : null,
    rating: row.rating ? { stars: row.rating.stars, comment: row.rating.comment } : null,
    slug: row.recipientSlug,
    recipientPath: `/r/${row.recipientSlug}`,
    hasDigitalCard: Boolean(row.digitalCard),
    createdAt: row.createdAt,
    reprints: row.shipments.filter((s) => s.kind === 'reprint').length,
  };
}

export async function listOrders(accountId: string, today: Date): Promise<OrderView[]> {
  const rows = await prisma.order.findMany({
    where: { accountId },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((r) => toOrderView(r, today));
}

export async function getOrder(id: string, today: Date): Promise<OrderView | null> {
  const row = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  return row ? toOrderView(row, today) : null;
}

export async function getOrderBySlug(slug: string, today: Date) {
  const row = await prisma.order.findUnique({
    where: { recipientSlug: slug },
    include: { ...orderInclude, account: { select: { name: true } } },
  });
  if (!row) return null;
  return {
    view: toOrderView(row, today),
    senderName: row.account.name,
    digitalCard: row.digitalCard,
    accountId: row.accountId,
  };
}

function pushHistory(row: OrderRow, stage: Stage): StageEvent[] {
  const history = (Array.isArray(row.stageHistory)
    ? row.stageHistory
    : []) as unknown as StageEvent[];
  return [...history, { stage, at: new Date().toISOString() }];
}

async function ensureSentInventory(row: OrderRow): Promise<void> {
  const existing = await prisma.inventoryItem.findFirst({
    where: { orderId: row.id, direction: 'sent' },
  });
  if (existing) return;
  const card = parseCard(row.cardSpec);
  const now = new Date();
  await prisma.inventoryItem.create({
    data: {
      accountId: row.accountId,
      orderId: row.id,
      digitalCardId: row.digitalCard?.id ?? null,
      direction: 'sent',
      fromName: SENDER,
      toName: row.recipientName,
      occasionType: row.occasionType,
      design: card.design,
      message: card.message,
      receivedAt: now,
      keptUntil: addYears(now, RULES.inventoryYears),
      cardSpec: json(card),
    },
  });
}

/** "Run the next step": every open order moves one stage, with the partner adapters called. */
export async function advanceAll(accountId: string, today: Date): Promise<{ moved: number }> {
  const rows = await prisma.order.findMany({ where: { accountId }, include: orderInclude });
  const printers = getPrinters();
  const carrier = getCarrier();
  let moved = 0;
  for (const row of rows) {
    const mode = row.mode as Mode;
    const next = nextStage({ mode, stage: row.stage as Stage });
    if (!next) continue;
    const card = parseCard(row.cardSpec);
    const printerName = row.printer
      ? `${row.printer.name} (${row.printer.city})`
      : 'the partner printer';
    let summary = `${row.recipientName}'s card: ${STAGE_LABELS[next]?.toLowerCase() ?? next}`;
    const shipment = row.shipments[0];
    switch (next) {
      case 'routed':
        summary = `Routed ${row.recipientName}'s card to ${printerName}`;
        break;
      case 'printed': {
        const job = await printers.submit(row.id, row.printerId ?? 'brum');
        if (shipment)
          await prisma.shipment.update({
            where: { id: shipment.id },
            data: {
              trackingEvents: json([
                {
                  at: new Date().toISOString(),
                  status: `Print job ${job.jobId} accepted (simulated)`,
                },
              ]),
            },
          });
        summary = `Printed ${card.size} ${card.finish} at ${printerName} (simulated)`;
        break;
      }
      case 'inspected': {
        const check = await printers.inspectionPhoto({
          jobId: `prt_${row.id.slice(-4)}`,
          printerId: row.printerId ?? 'brum',
        });
        if (shipment)
          await prisma.shipment.update({
            where: { id: shipment.id },
            data: { inspectionScore: check.score },
          });
        summary = `Inspected the print for ${row.recipientName}: score ${check.score.toFixed(2)}. ${check.note}`;
        break;
      }
      case 'posted': {
        const label = await carrier.label(
          row.id,
          mode === 'tracked' ? 'tracked24' : 'second_class',
        );
        if (shipment)
          await prisma.shipment.update({
            where: { id: shipment.id },
            data: {
              carrier: label.carrier,
              trackingEvents: json(await carrier.track(label.trackingId)),
            },
          });
        summary = `Posted ${row.recipientName}'s card ${mode === 'tracked' ? 'tracked next day' : 'second class'}, ${label.trackingId} (simulated), promised ${isoDate(row.promisedDate)}`;
        break;
      }
      case 'ready_for_pickup':
        summary = `${row.recipientName}'s card is ready at ${printerName}'s partner shop (simulated)`;
        break;
      case 'delivered':
      case 'collected':
        summary = `${row.recipientName}'s card ${next === 'collected' ? 'collected' : 'delivered'}${row.delayed ? ' late; recovery already ran' : ''}`;
        break;
      default:
        break;
    }
    await prisma.order.update({
      where: { id: row.id },
      data: { stage: next, stageHistory: json(pushHistory(row, next)) },
    });
    if (next === 'delivered' || next === 'collected') await ensureSentInventory(row);
    await decisions.record({ actor: 'rule', job: 'fulfilment', summary, orderId: row.id });
    moved += 1;
  }
  void today;
  return { moved };
}

/** Simulate a postal delay and run the recovery bundle. */
export async function delayOrder(
  orderId: string,
  accountId: string,
  today: Date,
): Promise<OrderView | null> {
  const row = await prisma.order.findFirst({
    where: { id: orderId, accountId },
    include: orderInclude,
  });
  if (!row || isTerminal(row.stage as Stage) || row.delayed)
    return row ? toOrderView(row, today) : null;
  const card = parseCard(row.cardSpec);
  const actions = planRecovery(
    {
      id: row.id,
      mode: row.mode as Mode,
      guarantee: row.guarantee,
      totalPence: row.totalPence,
      occasionDate: row.occasionDate,
    },
    today,
    card.size,
  );
  const payments = getPayments();
  const log: decisions.DecisionInput[] = [
    {
      actor: 'rule',
      job: 'delay',
      summary: `Postal delay detected for ${row.recipientName}'s card (simulated): promised ${isoDate(row.promisedDate)}`,
      orderId: row.id,
    },
  ];
  for (const action of actions) {
    switch (action.type) {
      case 'refund': {
        const refund = await payments.refund(`pay_${row.id.slice(-8)}`, action.pence);
        log.push({
          actor: 'rule',
          job: 'recovery',
          summary: `Refunded ${formatPence(action.pence)} under the delivery guarantee (${refund.refundId}, simulated)`,
          orderId: row.id,
        });
        break;
      }
      case 'reprint':
        await prisma.shipment.create({
          data: {
            orderId: row.id,
            printerId: row.printerId,
            kind: 'reprint',
            carrier: 'Royal Mail Tracked 24 (simulated)',
          },
        });
        log.push({
          actor: 'rule',
          job: 'recovery',
          summary: `Tracked reprint ordered from ${row.printer?.name ?? 'the partner printer'} for ${row.recipientName}`,
          orderId: row.id,
        });
        break;
      case 'ecard': {
        const runAt = new Date(startOfDay(row.occasionDate));
        runAt.setHours(8, 0, 0, 0);
        await prisma.job.create({
          data: { type: 'send_ecard', payload: json({ orderId: row.id }), runAt },
        });
        log.push({
          actor: 'rule',
          job: 'recovery',
          summary: `On-the-day eCard scheduled for ${isoDate(row.occasionDate)}`,
          orderId: row.id,
        });
        break;
      }
      case 'discount':
        log.push({
          actor: 'rule',
          job: 'recovery',
          summary: `50% next-card code issued: ${action.detail ?? ''}`,
          orderId: row.id,
        });
        break;
    }
  }
  await prisma.recovery.upsert({
    where: { orderId: row.id },
    update: { actions: json(actions), costPence: recoveryCostPence(actions) },
    create: { orderId: row.id, actions: json(actions), costPence: recoveryCostPence(actions) },
  });
  await prisma.order.update({ where: { id: row.id }, data: { delayed: true } });
  await decisions.recordMany(log);
  return getOrder(row.id, today);
}

export async function rateOrder(
  slug: string,
  stars: number,
  comment: string | null,
): Promise<boolean> {
  const row = await prisma.order.findUnique({ where: { recipientSlug: slug } });
  if (!row) return false;
  const value = Math.max(1, Math.min(5, Math.round(stars)));
  await prisma.rating.upsert({
    where: { orderId: row.id },
    update: { stars: value, comment },
    create: { orderId: row.id, stars: value, comment },
  });
  await decisions.record({
    actor: 'person',
    job: 'rating',
    summary: `${row.recipientName} rated the card ${value} star${value === 1 ? '' : 's'}${comment ? `: "${comment.slice(0, 80)}"` : ''}`,
    orderId: row.id,
  });
  return true;
}

/** "Save to my Dearly": the recipient keeps the card and becomes a customer at no acquisition cost. */
export async function saveToInventory(slug: string, viewerAccountId: string): Promise<boolean> {
  const row = await prisma.order.findUnique({
    where: { recipientSlug: slug },
    include: { digitalCard: true, account: { select: { name: true } } },
  });
  if (!row) return false;
  const existing = await prisma.inventoryItem.findFirst({
    where: { orderId: row.id, direction: 'received', accountId: viewerAccountId },
  });
  if (existing) return true;
  const card = parseCard(row.cardSpec);
  const now = new Date();
  await prisma.inventoryItem.create({
    data: {
      accountId: viewerAccountId,
      orderId: row.id,
      digitalCardId: row.digitalCard?.id ?? null,
      direction: 'received',
      fromName: row.account.name,
      toName: row.recipientName,
      occasionType: row.occasionType,
      design: card.design,
      message: card.message,
      receivedAt: now,
      keptUntil: addYears(now, RULES.inventoryYears),
      cardSpec: json(card),
    },
  });
  await decisions.record({
    actor: 'rule',
    job: 'growth',
    summary: `Recipient ${row.recipientName} joined at no acquisition cost and saved the card to their Dearly`,
    orderId: row.id,
  });
  return true;
}

/** "Send one back": a thank-you reminder a week out for the person who sent the card. */
export async function sendOneBack(slug: string, today: Date): Promise<string | null> {
  const row = await prisma.order.findUnique({
    where: { recipientSlug: slug },
    include: { person: true },
  });
  if (!row?.person) return null;
  const date = isoDate(addDays(startOfDay(today), 7));
  const occasion = await prisma.occasion.create({
    data: { personId: row.person.id, type: 'thank_you', adhocDate: date },
  });
  const draft = defaultProposal({
    person: row.person,
    occasion: toOccasionLike(occasion),
    today,
    sender: SENDER,
  });
  if (!draft) return null;
  const key = `${draft.key}|back|${occasion.id.slice(-4)}`;
  await prisma.proposal.create({
    data: {
      key,
      personId: row.person.id,
      occasionId: occasion.id,
      status: 'proposed',
      cardSpec: json({
        ...draft.card,
        message: `Thank you for the lovely card. It made my day. Love, ${row.recipientName.split(' ')[0]}`,
      }),
      aiReason: 'Reply card from the recipient view (simulated recipient account)',
      flags: json(['reply card']),
      dueDate: draft.dueDate,
    },
  });
  await decisions.record({
    actor: 'person',
    job: 'send_back',
    summary: `${row.recipientName} chose "Send one back": a thank-you card is proposed for ${date} (simulated recipient loop)`,
    orderId: row.id,
  });
  return key;
}

/** Ratings by printer, blended with the seed score. */
export async function printerScores() {
  const printers = await prisma.printer.findMany({ orderBy: { score: 'desc' } });
  const ratings = await prisma.rating.findMany({
    include: { order: { select: { printerId: true } } },
  });
  const orders = await prisma.order.groupBy({ by: ['printerId'], _count: { _all: true } });
  return printers.map((p) => {
    const mine = ratings.filter((r) => r.order.printerId === p.id).map((r) => r.stars);
    return {
      ...p,
      ratings: mine.length,
      blended: blendedScore(p.score, mine, RULES.ratingWeight),
      ordersRouted: orders.find((o) => o.printerId === p.id)?._count._all ?? 0,
    };
  });
}

export async function ordersForAgent(accountId: string, today: Date): Promise<AgentOrderView[]> {
  const rows = await listOrders(accountId, today);
  return rows.slice(0, 12).map((o) => ({
    id: o.id,
    person: o.recipientName,
    stage: o.stage,
    promised: isoDate(o.promisedDate),
    late: o.late,
    damaged: false,
  }));
}

/** Execute the action the help agent chose, within the allowed list. */
export async function applyAgentAction(
  orderId: string | null,
  action: AgentAction,
  accountId: string,
  today: Date,
  by: 'ai' | 'rule',
): Promise<string | null> {
  if (action === 'none') return null;
  if (action === 'escalate') {
    await decisions.record({
      actor: by,
      job: 'agent_turn',
      summary: 'Escalated the conversation to a person on the team',
      orderId,
    });
    return 'Escalated to a person';
  }
  if (!orderId) return null;
  const row = await prisma.order.findFirst({
    where: { id: orderId, accountId },
    include: orderInclude,
  });
  if (!row) return null;
  const view = toOrderView(row, today);
  switch (action) {
    case 'refund': {
      if (!view.late && !view.delayed) return null;
      const refund = await getPayments().refund(`pay_${row.id.slice(-8)}`, row.totalPence);
      await decisions.record({
        actor: by,
        job: 'agent_turn',
        summary: `Refunded ${formatPence(row.totalPence)} for ${row.recipientName}'s late card (${refund.refundId}, simulated)`,
        orderId,
      });
      return `Refunded ${formatPence(row.totalPence)}`;
    }
    case 'reprint': {
      await prisma.shipment.create({
        data: {
          orderId: row.id,
          printerId: row.printerId,
          kind: 'reprint',
          carrier: 'Royal Mail Tracked 24 (simulated)',
        },
      });
      const runAt = new Date(startOfDay(row.occasionDate));
      runAt.setHours(8, 0, 0, 0);
      await prisma.job.create({
        data: { type: 'send_ecard', payload: json({ orderId: row.id }), runAt },
      });
      await decisions.record({
        actor: by,
        job: 'agent_turn',
        summary: `Tracked reprint and on-the-day eCard arranged for ${row.recipientName}`,
        orderId,
      });
      return 'Tracked reprint and eCard arranged';
    }
    case 'upgrade': {
      if (view.terminal || row.stage === 'posted' || row.mode === 'ecard') return null;
      const promised = arrivalDate('tracked', view.card.size, row.occasionDate, today);
      await prisma.order.update({
        where: { id: row.id },
        data: {
          mode: 'tracked',
          promisedDate: promised,
          cardSpec: json({ ...view.card, mode: 'tracked', modeOverridden: true }),
        },
      });
      await decisions.record({
        actor: by,
        job: 'agent_turn',
        summary: `Upgraded ${row.recipientName}'s card to tracked, now promised ${isoDate(promised)}`,
        orderId,
      });
      return 'Upgraded to tracked';
    }
    case 'send_ecard': {
      if (!row.digitalCard)
        await prisma.digitalCard.create({
          data: { orderId: row.id, slug: row.recipientSlug, animation: 'envelope' },
        });
      await decisions.record({
        actor: by,
        job: 'agent_turn',
        summary: `eCard sent by link to ${row.recipientName}`,
        orderId,
      });
      return 'eCard sent';
    }
    default:
      return null;
  }
}

export function daysUntil(date: Date, today: Date): number {
  return daysBetween(startOfDay(today), startOfDay(date));
}
