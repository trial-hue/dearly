import {
  RULES,
  TITLES,
  addDays,
  addYears,
  defaultProposal,
  formatPence,
  isOccasionType,
  quote,
  startOfDay,
  type CardSpec,
  type OccasionType,
} from '@/domain';
import { prisma } from '@/server/db';
import { newSlug } from '@/server/ids';
import { json } from '@/server/json';

import * as decisions from './decisionLog';
import { mediaUrl } from './media';
import { toOccasionLike } from './people';
import { SENDER } from './proposals';

export interface SendEcardInput {
  personId: string;
  occasion: OccasionType;
  message: string;
  font: CardSpec['font'];
  design: CardSpec['design'];
  animation: 'envelope' | 'flip' | 'confetti';
  drawingMediaId: string | null;
  narrationMediaId: string | null;
  clipMediaId: string | null;
  wordTimings: number[];
}

/** Send a rich eCard now: a delivered order, its digital card and an Inventory copy. */
export async function sendEcard(accountId: string, input: SendEcardInput, today: Date) {
  const person = await prisma.person.findFirst({
    where: { id: input.personId, accountId },
    include: { occasions: true },
  });
  if (!person) return null;
  const occasionRow = person.occasions.find((o) => o.type === input.occasion) ?? null;
  const occasionDate = occasionRow
    ? (defaultProposal({ person, occasion: toOccasionLike(occasionRow), today, sender: SENDER })
        ?.dueDate ?? startOfDay(today))
    : startOfDay(today);
  const card: CardSpec = {
    design: input.design,
    size: 'regular',
    finish: 'signature',
    mode: 'ecard',
    modeOverridden: true,
    digital: false,
    gift: 'none',
    message: input.message,
    font: input.font,
  };
  const q = quote(card);
  const slug = newSlug();
  const now = new Date();
  const [drawingUrl, narrationUrl, clipUrl] = await Promise.all([
    mediaUrl(input.drawingMediaId),
    mediaUrl(input.narrationMediaId),
    mediaUrl(input.clipMediaId),
  ]);
  const order = await prisma.order.create({
    data: {
      accountId,
      personId: person.id,
      recipientName: person.name,
      occasionType: isOccasionType(input.occasion) ? input.occasion : 'thank_you',
      occasionDate,
      cardSpec: json(card),
      quote: json(q),
      totalPence: q.totalPence,
      mode: 'ecard',
      promisedDate: startOfDay(today),
      guarantee: false,
      stage: 'delivered',
      stageHistory: json([{ stage: 'delivered', at: now.toISOString() }]),
      recipientSlug: slug,
      digitalCard: {
        create: {
          slug,
          animation: input.animation,
          narrationUrl,
          clipUrl,
          drawingUrl,
          wordTimings: json(input.wordTimings),
          expiresAt: addYears(now, RULES.inventoryYears),
        },
      },
      inventory: {
        create: {
          accountId,
          direction: 'sent',
          fromName: SENDER,
          toName: person.name,
          occasionType: input.occasion,
          design: input.design,
          message: input.message,
          receivedAt: now,
          keptUntil: addDays(now, 365 * RULES.inventoryYears),
          cardSpec: json(card),
        },
      },
    },
  });
  await decisions.recordMany([
    {
      actor: 'person',
      job: 'ecard',
      summary: `Sent a ${TITLES[input.occasion].toLowerCase()} eCard to ${person.name} for ${formatPence(q.totalPence)}${narrationUrl ? ' with narration' : ''}${clipUrl ? ' and a clip' : ''}`,
      orderId: order.id,
    },
    {
      actor: 'rule',
      job: 'payment',
      summary: `Payment of ${formatPence(q.totalPence)} captured (simulated)`,
      orderId: order.id,
    },
  ]);
  return { orderId: order.id, slug };
}
