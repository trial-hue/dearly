import type { Metadata } from 'next';

import { HelpChat } from '@/components/help/HelpChat';
import { PageHeader } from '@/components/shell/PageHeader';
import { serialize } from '@/lib/serialize';
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
      <PageHeader
        title="Help"
        lede="The AI agent answers and acts: reprints, eCards, upgrades and refunds within the rules. In production it also answers the phone, and always says it is an AI."
      />
      <HelpChat
        orders={serialize(
          orders.slice(0, 6).map((o) => ({
            id: o.id,
            recipientName: o.recipientName,
            stage: o.stage,
            promisedDate: o.promisedDate,
            late: o.late,
          })),
        )}
      />
    </div>
  );
}
