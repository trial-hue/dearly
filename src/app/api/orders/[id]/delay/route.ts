import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { ok, problem } from '@/server/http';
import { delayOrder } from '@/server/services/orders';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const accountId = await getAccountId();
  const view = await delayOrder(id, accountId, now());
  return view ? ok(view) : problem(404, 'Order not found');
}
