'use client';

import Link from 'next/link';

import { CardFront } from '@/components/card/CardFront';
import { useToast } from '@/components/shell/Toast';
import { Badge, ErrorNote, Simulated } from '@/components/ui';
import { MODES, STAGE_LABELS } from '@/domain';
import { api, useAction } from '@/lib/fetcher';
import { fmtDate, fmtTime, formatPence } from '@/lib/format';
import type { Serialized } from '@/lib/serialize';
import type { OrderView } from '@/server/services/orders';

export type OrderDTO = Serialized<OrderView>;

export function OrderCard({ order: o, qrSvg }: { order: OrderDTO; qrSvg: string }) {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  const idx = o.stages.indexOf(o.stage);
  const canDelay =
    !o.terminal &&
    !o.delayed &&
    o.mode !== 'ecard' &&
    o.mode !== 'pickup' &&
    (o.stage === 'posted' || o.stage === 'inspected');
  const first = o.recipientName.split(' ')[0];
  return (
    <article className="card" data-testid={`order-${o.id}`} aria-labelledby={`o-${o.id}`}>
      <div className="flex flex-wrap gap-4">
        <div className="w-[72px] shrink-0">
          <CardFront card={o.card} title={o.title} name={first} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 id={`o-${o.id}`} className="font-bold">
              {o.recipientName}
            </h3>
            <span className="text-sm">{o.title.toLowerCase()}</span>
            <span className="muted text-sm">for {fmtDate(o.occasionDate)}</span>
            {o.delayed ? (
              <Badge kind="danger">Delayed, recovery ran</Badge>
            ) : o.late ? (
              <Badge kind="flag">Late</Badge>
            ) : null}
            {o.rating ? <Badge kind="ai">Rated {o.rating.stars} of 5</Badge> : null}
          </div>
          <ol className="mt-2 flex flex-wrap gap-1" aria-label="Stages">
            {o.stages.map((s, i) => (
              <li
                key={s}
                className={`step ${i < idx ? 'step-done' : i === idx ? 'step-now' : ''}`}
                aria-current={i === idx ? 'step' : undefined}
                data-testid={i === idx ? 'stage-current' : undefined}
              >
                {STAGE_LABELS[s] ?? s}
              </li>
            ))}
          </ol>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs sm:grid-cols-4">
            <dt className="muted">Printer</dt>
            <dd>{o.printer ? `${o.printer.name}, ${o.printer.city}` : 'None (eCard)'}</dd>
            <dt className="muted">Delivery</dt>
            <dd>{MODES[o.mode].label}</dd>
            <dt className="muted">Promised</dt>
            <dd>{fmtDate(o.promisedDate)}</dd>
            <dt className="muted">Price</dt>
            <dd className="font-bold tabular-nums">{formatPence(o.totalPence)}</dd>
          </dl>
          <div className="mt-2 flex flex-wrap gap-1">
            {o.guarantee ? <Badge kind="ai">Delivery guarantee</Badge> : null}
            {o.printer ? <Simulated what="printer" /> : null}
            {o.reprints > 0 ? <Badge>{o.reprints} reprint</Badge> : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {canDelay ? (
              <button
                type="button"
                className="btn btn-sm"
                disabled={busy !== null}
                data-testid="delay"
                onClick={() =>
                  run('delay', async () => {
                    await api(`/api/orders/${o.id}/delay`, { json: {} });
                    toast('Delay simulated. Recovery ran and is in the log.');
                  })
                }
              >
                {busy === 'delay' ? 'Recovering…' : 'Simulate a postal delay'}
              </button>
            ) : null}
            <Link href={o.recipientPath} className="btn btn-sm" data-testid="open-recipient">
              Open the recipient&rsquo;s view
            </Link>
          </div>
          <ErrorNote message={error} />
        </div>
        <div className="flex w-[104px] shrink-0 flex-col items-center gap-1 text-center">
          <div
            className="rounded-md border border-line bg-white p-1"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
            aria-label="QR code printed on the card back"
            role="img"
          />
          <span className="muted text-[11px] leading-tight">
            QR on the card back opens the recipient page
          </span>
        </div>
      </div>
      {o.recovery ? (
        <div className="mt-3 rounded-md bg-dangerbg/60 p-3" data-testid="recovery">
          <h4 className="text-sm font-bold text-red">Recovery, ran {fmtTime(o.recovery.at)}</h4>
          <ul className="mt-1 space-y-0.5 text-sm">
            {o.recovery.actions.map((a) => (
              <li key={a.type} className="flex flex-wrap gap-x-2">
                <span className="font-medium">{a.label}</span>
                {a.detail ? <span className="muted">{a.detail}</span> : null}
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
