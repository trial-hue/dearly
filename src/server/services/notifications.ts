import {
  PICKUP_PROMISE,
  REMINDER_STEPS,
  TITLES,
  formatPence,
  scheduleFor,
  type Mode,
  type OccasionType,
  type Quote,
  type ReminderStep,
} from '@/domain';
import { env } from '@/env';
import { prisma } from '@/server/db';

import * as decisions from './decisionLog';

/**
 * Reminders and transactional messages, held in an outbox. Sending is simulated: `sendDue`
 * marks due rows as sent. Nothing here approves, pays or changes a card; every message links
 * back to the Reminders page. No surname, address or postcode is ever rendered.
 */

export interface ReminderInput {
  accountId: string;
  proposalKey: string;
  proposalId: string;
  firstName: string;
  occasionType: OccasionType;
  dueDate: Date;
  arrival: Date;
  mode: Mode;
  quote: Quote;
  paused: boolean;
  today: Date;
}

export interface Rendered {
  subject: string;
  text: string;
  html: string;
}

const REMINDER_STEP_NAMES = new Set<string>(REMINDER_STEPS.map((s) => s.step));

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function longDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function promiseLine(mode: Mode, arrival: Date): string {
  if (mode === 'ecard') return 'Sent by link on the day';
  if (mode === 'pickup') return PICKUP_PROMISE;
  return `Arrives by ${longDate(arrival)}`;
}

/** The reminder message for one proposal at one step, every price read from the quote. */
export function renderReminder(input: ReminderInput, step: ReminderStep): Rendered {
  const title = TITLES[input.occasionType] ?? input.occasionType;
  const link = `${env.APP_URL}/reminders#r-${input.proposalId}`;
  const daysBefore = REMINDER_STEPS.find((s) => s.step === step)?.daysBefore ?? 0;
  const subject = `A card for ${input.firstName} is ready to approve`;
  const lines = input.quote.lines.map((l) => `${l.label}: ${formatPence(l.pence)}`);
  const total = `Total, delivery included: ${formatPence(input.quote.totalPence)}`;
  const promise = promiseLine(input.mode, input.arrival);
  const when = `${title} for ${input.firstName}, ${longDate(input.dueDate)} (${daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`}).`;
  const text = [
    when,
    'We have drafted the card, chosen the options and priced it. One tap approves it.',
    promise,
    '',
    ...lines,
    total,
    '',
    `Approve or edit it here: ${link}`,
  ].join('\n');
  const html = [
    `<p>${escapeHtml(when)}</p>`,
    '<p>We have drafted the card, chosen the options and priced it. One tap approves it.</p>',
    `<p>${escapeHtml(promise)}</p>`,
    `<ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>`,
    `<p><strong>${escapeHtml(total)}</strong></p>`,
    `<p><a href="${escapeHtml(link)}">Approve or edit the card</a></p>`,
  ].join('');
  return { subject, text, html };
}

/** Schedule the remaining reminder steps for a proposal. Returns how many were scheduled. */
export async function scheduleForProposal(input: ReminderInput): Promise<number> {
  const steps = scheduleFor(input.dueDate, input.today, input.paused);
  if (steps.length === 0) return 0;
  const existing = await prisma.notification.count({
    where: { proposalKey: input.proposalKey, status: { in: ['scheduled', 'sent'] } },
  });
  if (existing > 0) return 0;
  await prisma.notification.createMany({
    data: steps.map((s) => {
      const r = renderReminder(input, s.step);
      return {
        accountId: input.accountId,
        proposalKey: input.proposalKey,
        channel: 'email',
        step: s.step,
        subject: r.subject,
        html: r.html,
        text: r.text,
        scheduledFor: s.scheduledFor,
        status: 'scheduled',
      };
    }),
  });
  await decisions.record({
    actor: 'rule',
    job: 'reminder',
    summary: `Scheduled ${steps.length} reminder${steps.length === 1 ? '' : 's'} for ${input.firstName}'s ${(TITLES[input.occasionType] ?? input.occasionType).toLowerCase()} card, first on ${longDate(steps[0]!.scheduledFor)}`,
  });
  return steps.length;
}

async function cancelWhere(where: { proposalKey?: string | { in: string[] } }, what: string) {
  const r = await prisma.notification.updateMany({
    where: { ...where, status: 'scheduled' },
    data: { status: 'cancelled' },
  });
  if (r.count > 0)
    await decisions.record({
      actor: 'rule',
      job: 'reminder',
      summary: `Cancelled ${r.count} scheduled reminder${r.count === 1 ? '' : 's'} ${what}`,
    });
  return r.count;
}

/** After an approval or a skip: nothing more to remind about. */
export async function cancelForProposal(key: string): Promise<number> {
  return cancelWhere({ proposalKey: key }, 'for a decided card');
}

/** After a pause: no reminders for any of that person's cards. */
export async function cancelForPerson(personId: string): Promise<number> {
  const keys = (await prisma.proposal.findMany({ where: { personId }, select: { key: true } })).map(
    (p) => p.key,
  );
  if (keys.length === 0) return 0;
  return cancelWhere({ proposalKey: { in: keys } }, 'for a paused person');
}

/** A transactional message when a delayed order has been recovered. Sent at once. */
export async function sendRecovery(order: {
  id: string;
  accountId: string;
  recipientFirstName: string;
  totalPence: number;
  actions: { label: string }[];
}): Promise<void> {
  const subject = `About ${order.recipientFirstName}'s card: we have acted on a delay`;
  const items = order.actions.map((a) => a.label);
  const text = [
    `The post is running late for ${order.recipientFirstName}'s card. Here is what we have done:`,
    ...items.map((i) => `- ${i}`),
    `The refund is the full amount you paid, ${formatPence(order.totalPence)}.`,
    `Details: ${env.APP_URL}/orders`,
  ].join('\n');
  const html = [
    `<p>${escapeHtml(`The post is running late for ${order.recipientFirstName}'s card. Here is what we have done:`)}</p>`,
    `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`,
    `<p>${escapeHtml(`The refund is the full amount you paid, ${formatPence(order.totalPence)}.`)}</p>`,
    `<p><a href="${escapeHtml(`${env.APP_URL}/orders`)}">See the order</a></p>`,
  ].join('');
  const now = new Date();
  await prisma.notification.create({
    data: {
      accountId: order.accountId,
      orderId: order.id,
      channel: 'email',
      step: 'recovery',
      subject,
      html,
      text,
      scheduledFor: now,
      sentAt: now,
      status: 'sent',
    },
  });
  await decisions.record({
    actor: 'rule',
    job: 'reminder',
    summary: `Sent the recovery message for ${order.recipientFirstName}'s card (simulated email)`,
    orderId: order.id,
  });
}

/** Mark every scheduled message due by `now` as sent (simulated). Returns how many. */
export async function sendDue(now: Date): Promise<number> {
  const r = await prisma.notification.updateMany({
    where: { status: 'scheduled', scheduledFor: { lte: now } },
    data: { status: 'sent', sentAt: now },
  });
  if (r.count > 0)
    await decisions.record({
      actor: 'rule',
      job: 'reminder',
      summary: `Sent ${r.count} reminder${r.count === 1 ? '' : 's'} from the outbox (simulated email)`,
    });
  return r.count;
}

export interface ReminderSummary {
  lastSentAt: Date | null;
  nextAt: Date | null;
}

/** For the Reminders page: when each proposal was last emailed and when the next one goes. */
export async function summaryForKeys(keys: string[]): Promise<Map<string, ReminderSummary>> {
  const out = new Map<string, ReminderSummary>();
  if (keys.length === 0) return out;
  const rows = await prisma.notification.findMany({
    where: { proposalKey: { in: keys }, status: { in: ['scheduled', 'sent'] } },
    select: { proposalKey: true, status: true, sentAt: true, scheduledFor: true },
  });
  for (const r of rows) {
    const key = r.proposalKey as string;
    const cur = out.get(key) ?? { lastSentAt: null, nextAt: null };
    if (r.status === 'sent' && r.sentAt && (!cur.lastSentAt || r.sentAt > cur.lastSentAt))
      cur.lastSentAt = r.sentAt;
    if (r.status === 'scheduled' && (!cur.nextAt || r.scheduledFor < cur.nextAt))
      cur.nextAt = r.scheduledFor;
    out.set(key, cur);
  }
  return out;
}

export interface OutboxRow {
  id: string;
  recipient: string;
  step: string;
  channel: string;
  subject: string;
  scheduledFor: Date;
  sentAt: Date | null;
  status: string;
  html: string;
}

/** Every message, newest first, with the card's recipient looked up from the proposal. */
export async function listOutbox(limit = 200): Promise<OutboxRow[]> {
  const rows = await prisma.notification.findMany({
    orderBy: [{ scheduledFor: 'desc' }],
    take: limit,
  });
  const keys = [...new Set(rows.map((r) => r.proposalKey).filter(Boolean))] as string[];
  const orderIds = [...new Set(rows.map((r) => r.orderId).filter(Boolean))] as string[];
  const [proposals, orders] = await Promise.all([
    keys.length
      ? prisma.proposal.findMany({
          where: { key: { in: keys } },
          select: { key: true, person: { select: { name: true } } },
        })
      : [],
    orderIds.length
      ? prisma.order.findMany({
          where: { id: { in: orderIds } },
          select: { id: true, recipientName: true },
        })
      : [],
  ]);
  const byKey = new Map(proposals.map((p) => [p.key, p.person.name.split(' ')[0] ?? '']));
  const byOrder = new Map(orders.map((o) => [o.id, o.recipientName.split(' ')[0] ?? '']));
  return rows.map((r) => ({
    id: r.id,
    recipient:
      (r.proposalKey && byKey.get(r.proposalKey)) || (r.orderId && byOrder.get(r.orderId)) || '',
    step: r.step,
    channel: r.channel,
    subject: r.subject,
    scheduledFor: r.scheduledFor,
    sentAt: r.sentAt,
    status: r.status,
    html: r.html,
  }));
}

export interface ReminderCounters {
  remindersScheduled: number;
  remindersSent: number;
  approvedWithin48h: number;
}

/** Counters for Operations. Never throws: a failure reads as zeros. */
export async function reminderCounters(accountId: string): Promise<ReminderCounters> {
  try {
    const [scheduled, sent, sentRows, orders] = await Promise.all([
      prisma.notification.count({
        where: { accountId, status: 'scheduled', step: { in: [...REMINDER_STEP_NAMES] } },
      }),
      prisma.notification.count({
        where: { accountId, status: 'sent', step: { in: [...REMINDER_STEP_NAMES] } },
      }),
      prisma.notification.findMany({
        where: { accountId, status: 'sent', step: { in: [...REMINDER_STEP_NAMES] } },
        select: { proposalKey: true, sentAt: true },
      }),
      prisma.order.findMany({
        where: { accountId, proposalId: { not: null } },
        select: { createdAt: true, proposal: { select: { key: true } } },
      }),
    ]);
    const window = 48 * 60 * 60 * 1000;
    const approvedWithin48h = orders.filter((o) => {
      const key = o.proposal?.key;
      return sentRows.some(
        (s) =>
          s.proposalKey === key &&
          s.sentAt &&
          o.createdAt.getTime() >= s.sentAt.getTime() &&
          o.createdAt.getTime() <= s.sentAt.getTime() + window,
      );
    }).length;
    return { remindersScheduled: scheduled, remindersSent: sent, approvedWithin48h };
  } catch {
    return { remindersScheduled: 0, remindersSent: 0, approvedWithin48h: 0 };
  }
}
