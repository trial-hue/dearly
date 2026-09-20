import type { Metadata } from 'next';

import { CardMock } from '@/components/card/CardMock';
import { Tabs } from '@/components/reminders/Tabs';
import { EmptyState } from '@/components/store/EmptyState';
import { RULES, type DesignId } from '@/domain';
import { daysLabel, fmtDate } from '@/lib/format';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { listInventory, type InventoryView } from '@/server/services/inventory';

export const metadata: Metadata = { title: 'My cards' };
export const dynamic = 'force-dynamic';

function Item({ item }: { item: InventoryView }) {
  const who = item.direction === 'received' ? `From ${item.fromName}` : `To ${item.toName}`;
  return (
    <li className="tile mb-4 break-inside-avoid p-3" data-testid={`mycard-${item.id}`}>
      <CardMock
        card={item.card ?? { design: item.design as DesignId, customFront: null }}
        title={item.title}
        name={item.toName.split(' ')[0]}
        hover={false}
      />
      <div className="mt-3">
        <p className="font-bold">{who}</p>
        <p className="text-sm text-ink-2">
          {item.title} · {fmtDate(item.receivedAt)}
        </p>
        <p className="mt-1 line-clamp-2 font-hand text-[18px] leading-tight">{item.message}</p>
        <p className={`mt-1 text-xs ${item.warn ? 'text-warning' : 'text-ink-2'}`}>
          {item.warn
            ? `Leaves your cards ${daysLabel(item.daysLeft)}`
            : `Kept until ${fmtDate(item.keptUntil)}`}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {item.slug ? (
            <a href={`/r/${item.slug}`} className="btn btn-sm">
              Open
            </a>
          ) : null}
          <a
            href={`/api/inventory/${item.id}/card.svg`}
            className="btn btn-ghost btn-sm"
            download
            data-testid="download-card"
          >
            Download
          </a>
        </div>
      </div>
    </li>
  );
}

export default async function MyCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: raw } = await searchParams;
  const tab = raw === 'sent' ? 'sent' : 'received';
  const accountId = await getAccountId();
  const { received, sent } = await listInventory(accountId, now());
  const list = tab === 'sent' ? sent : received;
  return (
    <div className="container-x section">
      <div className="mb-4">
        <h1 className="t-h1">My cards</h1>
        <p className="text-sm text-ink-2">
          Every card you send or receive stays here for {RULES.inventoryYears} years.
        </p>
      </div>
      <Tabs
        base="/my-cards"
        current={tab}
        tabs={[
          { id: 'received', label: 'Received', count: received.length },
          { id: 'sent', label: 'Sent', count: sent.length },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState
          title={tab === 'sent' ? 'Nothing sent yet' : 'Nothing received yet'}
          text={
            tab === 'sent'
              ? 'Delivered cards appear here.'
              : 'When someone saves a card to their Dearly, it lives here.'
          }
          cta="Browse cards"
          ctaHref="/cards"
        />
      ) : (
        <ul className="columns-2 gap-4 md:columns-3 lg:columns-4">
          {list.map((i) => (
            <Item key={i.id} item={i} />
          ))}
        </ul>
      )}
    </div>
  );
}
