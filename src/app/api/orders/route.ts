import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { ok } from '@/server/http';
import { listOrders } from '@/server/services/orders';

export const dynamic = 'force-dynamic';

export async function GET() {
  const accountId = await getAccountId();
  return ok(await listOrders(accountId, now()));
}
