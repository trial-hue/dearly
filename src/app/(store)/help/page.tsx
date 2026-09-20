import type { Metadata } from 'next';

import { HelpChat } from '@/components/help/HelpChat';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { listOrders } from '@/server/services/orders';

export const metadata: Metadata = { title: 'Help' };
export const dynamic = 'force-dynamic';

export default async function HelpPage() {
  const accountId = await getAccountId();
  const orders = await listOrders(accountId, now());
  return (
    <div className="container-x section">
      <div className="mx-auto mb-6 max-w-2xl text-center">
        <h1 className="t-h1">How can we help?</h1>
        <p className="mt-1 text-ink-2">
          Ask about any card. We can reprint, resend, upgrade or refund straight away.
        </p>
      </div>
      <HelpChat
        recentNames={[
          ...new Set(orders.slice(0, 4).map((o) => o.recipientName.split(' ')[0] ?? '')),
        ]}
      />
    </div>
  );
}
