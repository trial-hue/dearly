import { isoDate } from '@/domain';
import { prisma } from '@/server/db';
import * as decisions from '@/server/services/decisionLog';

type Handler = (payload: Record<string, unknown>) => Promise<string>;

const handlers: Record<string, Handler> = {
  async send_ecard(payload) {
    const orderId = String(payload.orderId ?? '');
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { digitalCard: true },
    });
    if (!order) throw new Error(`order ${orderId} not found`);
    if (!order.digitalCard)
      await prisma.digitalCard.create({
        data: { orderId: order.id, slug: order.recipientSlug, animation: 'envelope' },
      });
    await decisions.record({
      actor: 'rule',
      job: 'ecard',
      summary: `On-the-day eCard sent to ${order.recipientName} by link`,
      orderId: order.id,
    });
    return `ecard sent for ${order.recipientName}`;
  },
  async send_batch_card(payload) {
    const batchId = String(payload.batchId ?? '');
    const name = String(payload.name ?? 'a colleague');
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error(`batch ${batchId} not found`);
    await decisions.record({
      actor: 'rule',
      job: 'business',
      summary: `Sent ${name}'s ${String(payload.occasion ?? 'birthday').replace('_', ' ')} card from the staff batch (${batch.deliveryOption === 'posted' ? 'home post' : 'office drop'}, simulated)`,
    });
    const remaining = await prisma.job.count({
      where: {
        type: 'send_batch_card',
        status: 'queued',
        payload: { path: ['batchId'], equals: batchId },
      },
    });
    if (remaining <= 1)
      await prisma.batch.update({ where: { id: batchId }, data: { status: 'sent' } });
    return `batch card sent for ${name}`;
  },
};

/** Run every queued job whose time has come. Returns a summary per job. */
export async function runDueJobs(
  now = new Date(),
  limit = 50,
): Promise<{ id: string; type: string; ok: boolean; result: string }[]> {
  const due = await prisma.job.findMany({
    where: { status: 'queued', runAt: { lte: now } },
    orderBy: { runAt: 'asc' },
    take: limit,
  });
  const out: { id: string; type: string; ok: boolean; result: string }[] = [];
  for (const job of due) {
    const handler = handlers[job.type];
    try {
      if (!handler) throw new Error(`no handler for ${job.type}`);
      const result = await handler((job.payload ?? {}) as Record<string, unknown>);
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'done', ranAt: now, attempts: { increment: 1 } },
      });
      out.push({ id: job.id, type: job.type, ok: true, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const failed = job.attempts + 1 >= 3;
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: failed ? 'failed' : 'queued',
          attempts: { increment: 1 },
          lastError: message,
          runAt: failed ? job.runAt : new Date(now.getTime() + 60_000),
        },
      });
      out.push({ id: job.id, type: job.type, ok: false, result: message });
    }
  }
  return out;
}

export function describeJob(type: string): string {
  return type === 'send_ecard'
    ? 'On-the-day eCard'
    : type === 'send_batch_card'
      ? 'Staff card send'
      : type;
}

export { isoDate };
