import Link from 'next/link';

import { CardMock } from '@/components/card/CardMock';
import { GuaranteeBadge } from '@/components/store/GuaranteeBadge';
import { MODES, PICKUP_PROMISE } from '@/domain';
import { fmtDate, formatPence } from '@/lib/format';
import type { Serialized } from '@/lib/serialize';
import type { OrderView } from '@/server/services/orders';

import { reminderHeadlineFromOrder } from './headline';
import { OrderTimeline } from './OrderTimeline';

export type OrderDTO = Serialized<OrderView>;

/** One order: the card, what it is, the stepper, the promise and a friendly recovery panel. */
export function OrderCard({ order: o, qrSvg }: { order: OrderDTO; qrSvg: string }) {
  const first = o.recipientName.split(' ')[0];
  return (
    <article className="tile p-4" data-testid={`order-${o.id}`} aria-labelledby={`o-${o.id}`}>
      <div className="flex flex-wrap gap-4">
        <div className="w-[120px] shrink-0">
          <CardMock card={o.card} title={o.title} name={first} bare hover={false} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id={`o-${o.id}`} className="t-h3">
            {reminderHeadlineFromOrder(o)}
          </h2>
          <p className="text-sm text-ink-2">
            {o.mode === 'ecard'
              ? 'eCard, sent by link'
              : o.mode === 'pickup'
                ? `${MODES[o.mode].label} · ${o.stage === 'collected' ? 'collected' : PICKUP_PROMISE}`
                : `${MODES[o.mode].label} · ${o.stage === 'delivered' ? 'arrived' : 'arrives by'} ${fmtDate(o.promisedDate)}`}
            {' · '}
            {formatPence(o.totalPence)}
          </p>
          <div className="mt-3">
            <OrderTimeline stages={o.stages} current={o.stage} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {o.guarantee ? <GuaranteeBadge compact /> : null}
            {o.rating ? (
              <span className="label label-success">They rated it {o.rating.stars} of 5</span>
            ) : null}
            {o.reprints > 0 ? <span className="label">Reprint sent</span> : null}
            <Link
              href={o.recipientPath}
              className="btn btn-sm ml-auto"
              data-testid="open-recipient"
            >
              Open their card
            </Link>
          </div>
        </div>
        <div className="hidden w-[88px] shrink-0 flex-col items-center text-center sm:flex">
          <div
            className="rounded-[8px] bg-white p-1"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
            role="img"
            aria-label="QR code on the back of the card"
          />
          <span className="mt-1 text-[11px] leading-tight text-ink-2">On the card back</span>
        </div>
      </div>
      {o.recovery ? (
        <div className="mt-4 rounded-[12px] bg-sky p-4" data-testid="recovery">
          <h3 className="font-bold">We noticed a delay. Here&rsquo;s what we&rsquo;ve done.</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {o.recovery.actions.map((a) => (
              <li key={a.type} className="flex flex-wrap gap-x-2">
                <span className="font-semibold">{a.label}</span>
                {a.detail ? <span className="text-ink-2">{a.detail}</span> : null}
                {a.pence ? (
                  <span className="ml-auto tabular-nums">{formatPence(a.pence)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
