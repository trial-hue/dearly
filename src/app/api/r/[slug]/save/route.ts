import { ok, problem } from '@/server/http';
import { saveToInventory } from '@/server/services/orders';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const done = await saveToInventory(slug);
  return done ? ok({ saved: true, accountId: done.accountId }) : problem(404, 'Card not found');
}
