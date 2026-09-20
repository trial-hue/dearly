import type { Metadata } from 'next';

import { CardFront } from '@/components/card/CardFront';
import { PageHeader } from '@/components/shell/PageHeader';
import { Badge, Empty } from '@/components/ui';
import { RULES, type DesignId } from '@/domain';
import { daysLabel, fmtDate } from '@/lib/format';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { listInventory, type InventoryView } from '@/server/services/inventory';

export const metadata: Metadata = { title: 'Inventory' };
export const dynamic = 'force-dynamic';

function Item({ item }: { item: InventoryView }) {
  const who = item.direction === 'received' ? `From ${item.fromName}` : `To ${item.toName}`;
  return (
    <li className="card flex gap-3" data-testid={`inventory-${item.id}`}>
      <div className="w-[64px] shrink-0">
        <CardFront
          card={item.card ?? { design: item.design as DesignId, customFront: null }}
          title={item.title}
          name={(item.direction === 'received' ? item.toName : item.toName).split(' ')[0]}
        />
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-bold">{who}</span>
          <span>{item.title.toLowerCase()}</span>
          <span className="muted">{fmtDate(item.receivedAt)}</span>
        </div>
        <p className="line-clamp-2 font-hand text-[17px] leading-tight">{item.message}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="muted text-xs">Kept until {fmtDate(item.keptUntil)}</span>
          {item.warn ? (
            <Badge kind="flag">Leaves the Inventory {daysLabel(item.daysLeft)}</Badge>
          ) : null}
          <a
            href={`/api/inventory/${item.id}/card.svg`}
            className="btn btn-sm ml-auto"
            download
            data-testid="download-card"
          >
            Download
          </a>
          {item.slug ? (
            <a href={`/r/${item.slug}`} className="btn btn-ghost btn-sm">
              Open
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default async function InventoryPage() {
  const accountId = await getAccountId();
  const { received, sent } = await listInventory(accountId, now());
  return (
    <>
      <PageHeader
        title="Inventory"
        lede={`Every card you receive or send is kept for ${RULES.inventoryYears} years. Download any of them as an SVG; a warning shows ${RULES.inventoryWarnDays} days before one leaves.`}
      />
      <h2 className="section-title mt-0">Received</h2>
      {received.length ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {received.map((i) => (
            <Item key={i.id} item={i} />
          ))}
        </ul>
      ) : (
        <Empty>
          No received cards yet. Open a recipient view and choose &ldquo;Save to my Dearly&rdquo;.
        </Empty>
      )}
      <h2 className="section-title">Sent</h2>
      {sent.length ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {sent.map((i) => (
            <Item key={i.id} item={i} />
          ))}
        </ul>
      ) : (
        <Empty>Delivered cards appear here.</Empty>
      )}
    </>
  );
}
