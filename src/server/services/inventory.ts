import { RULES, TITLES, daysBetween, startOfDay, type CardSpec, type OccasionType } from '@/domain';
import { prisma } from '@/server/db';

import { parseCard } from './proposals';

export interface InventoryView {
  id: string;
  direction: 'received' | 'sent';
  fromName: string;
  toName: string;
  occasionType: OccasionType;
  title: string;
  design: string;
  message: string;
  receivedAt: Date;
  keptUntil: Date;
  daysLeft: number;
  warn: boolean;
  card: CardSpec | null;
  orderId: string | null;
  slug: string | null;
}

export async function listInventory(
  accountId: string,
  today: Date,
): Promise<{ received: InventoryView[]; sent: InventoryView[] }> {
  const rows = await prisma.inventoryItem.findMany({
    where: { accountId },
    include: { order: { select: { recipientSlug: true } } },
    orderBy: { receivedAt: 'desc' },
  });
  const views = rows.map((r): InventoryView => {
    const daysLeft = daysBetween(startOfDay(today), startOfDay(r.keptUntil));
    let card: CardSpec | null = null;
    if (r.cardSpec) {
      try {
        card = parseCard(r.cardSpec);
      } catch {
        card = null;
      }
    }
    return {
      id: r.id,
      direction: r.direction as 'received' | 'sent',
      fromName: r.fromName,
      toName: r.toName,
      occasionType: r.occasionType as OccasionType,
      title: TITLES[r.occasionType as OccasionType] ?? r.occasionType,
      design: r.design,
      message: r.message,
      receivedAt: r.receivedAt,
      keptUntil: r.keptUntil,
      daysLeft,
      warn: daysLeft <= RULES.inventoryWarnDays,
      card,
      orderId: r.orderId,
      slug: r.order?.recipientSlug ?? null,
    };
  });
  return {
    received: views.filter((v) => v.direction === 'received'),
    sent: views.filter((v) => v.direction === 'sent'),
  };
}

export async function getInventoryItem(id: string, accountId: string) {
  return prisma.inventoryItem.findFirst({ where: { id, accountId } });
}
