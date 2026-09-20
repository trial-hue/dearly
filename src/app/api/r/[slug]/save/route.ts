import { getAccountId } from '@/server/auth';
import { ok, problem } from '@/server/http';
import { saveToInventory } from '@/server/services/orders';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getAccountId();
  const done = await saveToInventory(slug, viewer);
  return done ? ok({ saved: true }) : problem(404, 'Card not found');
}
