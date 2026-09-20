import type { Metadata } from 'next';
import QRCode from 'qrcode';

import { OrderCard } from '@/components/orders/OrderCard';
import { OrdersActions } from '@/components/orders/OrdersActions';
import { PageHeader } from '@/components/shell/PageHeader';
import { Empty } from '@/components/ui';
import { env } from '@/env';
import { serialize } from '@/lib/serialize';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { listOrders } from '@/server/services/orders';

export const metadata: Metadata = { title: 'Orders' };
export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const accountId = await getAccountId();
  const orders = await listOrders(accountId, now());
  const qr = await Promise.all(
    orders.map((o) =>
      QRCode.toString(`${env.APP_URL}${o.recipientPath}`, {
        type: 'svg',
        margin: 1,
        width: 88,
        color: { dark: '#141D36', light: '#FFFFFF' },
      }),
    ),
  );
  const open = orders.filter((o) => !o.terminal).length;
  return (
    <>
      <PageHeader
        title="Orders"
        lede="Every card moves through checked, routed, printed, inspected and posted with no one touching it. Delays trigger recovery automatically."
      >
        <OrdersActions openCount={open} />
      </PageHeader>
      {orders.length === 0 ? (
        <Empty>No orders yet. Approve a proposal on Today.</Empty>
      ) : (
        <div className="space-y-4" data-testid="orders-list">
          {orders.map((o, i) => (
            <OrderCard key={o.id} order={serialize(o)} qrSvg={qr[i] ?? ''} />
          ))}
        </div>
      )}
    </>
  );
}
