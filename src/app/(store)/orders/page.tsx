import type { Metadata } from 'next';
import QRCode from 'qrcode';

import { DemoControls } from '@/components/orders/DemoControls';
import { OrderCard } from '@/components/orders/OrderCard';
import { EmptyState } from '@/components/store/EmptyState';
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
        width: 80,
        color: { dark: '#14213D', light: '#FFFFFF' },
      }),
    ),
  );
  const open = orders.filter((o) => !o.terminal);
  const delayable = orders
    .filter(
      (o) =>
        !o.terminal &&
        !o.delayed &&
        o.mode !== 'ecard' &&
        o.mode !== 'pickup' &&
        (o.stage === 'posted' || o.stage === 'inspected'),
    )
    .map((o) => ({ id: o.id, name: o.recipientName }));
  return (
    <div className="container-x section">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="t-h1">Orders</h1>
          <p className="text-sm text-ink-2">
            Every card, where it is, and what we do if one runs late.
          </p>
        </div>
      </div>
      <div className="mb-6">
        <DemoControls openCount={open.length} delayable={delayable} />
      </div>
      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          text="Approve a card we have ready, or pick one to personalise."
          cta="Ready for you"
          ctaHref="/reminders"
        />
      ) : (
        <div className="space-y-4" data-testid="orders-list">
          {orders.map((o, i) => (
            <OrderCard key={o.id} order={serialize(o)} qrSvg={qr[i] ?? ''} />
          ))}
        </div>
      )}
    </div>
  );
}
