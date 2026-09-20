'use client';

import Link from 'next/link';

import { CardFront } from '@/components/card/CardFront';
import { useToast } from '@/components/shell/Toast';
import { Badge, ErrorNote } from '@/components/ui';
import { FINISHES, MODES, SIZES } from '@/domain';
import { api, useAction } from '@/lib/fetcher';
import { daysLabel, fmtDate, formatPence } from '@/lib/format';
import type { Serialized } from '@/lib/serialize';
import type { ProposalView } from '@/server/services/proposals';

export type ProposalDTO = Serialized<ProposalView>;

export function ProposalEnvelope({ proposal: p }: { proposal: ProposalDTO }) {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  const mode = MODES[p.card.mode];
  const first = p.person.name.split(' ')[0];
  return (
    <article
      className="envelope p-4 pt-5"
      data-testid={`proposal-${p.person.id}`}
      aria-labelledby={`p-${p.id}-title`}
    >
      <div className="flex gap-4">
        <div className="w-[96px] shrink-0 sm:w-[112px]">
          <CardFront card={p.card} title={p.title} name={first} age={p.age} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 id={`p-${p.id}-title`} className="text-base font-bold">
              {p.person.name}
            </h3>
            <span className="text-sm">
              {p.title.toLowerCase()}
              {p.age != null && p.occasionType === 'birthday' ? `, ${p.age}` : ''}
            </span>
          </div>
          <p className="muted text-sm">
            {fmtDate(p.dueDate)} · {daysLabel(p.daysLeft)}
          </p>
          <p
            className="mt-2 line-clamp-3 font-hand text-[17px] leading-tight"
            title={p.card.message}
          >
            {p.card.message}
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
            <dt className="muted">Card</dt>
            <dd>
              {p.card.mode === 'ecard'
                ? 'eCard only'
                : `${SIZES[p.card.size].label}, ${FINISHES[p.card.finish].label}`}
              {p.card.gift !== 'none' ? ', with a gift' : ''}
            </dd>
            <dt className="muted">Delivery</dt>
            <dd>
              {mode.label}, arrives {fmtDate(p.arrival)}
            </dd>
            <dt className="muted">Total</dt>
            <dd className="font-bold tabular-nums">{formatPence(p.quote.totalPence)}</dd>
          </dl>
          <div className="mt-2 flex flex-wrap gap-1">
            {p.quote.guarantee ? <Badge kind="ai">Delivery guarantee</Badge> : null}
            {p.messageBy === 'ai' ? (
              <Badge kind="ai">Message drafted by AI</Badge>
            ) : (
              <Badge>Built-in rules</Badge>
            )}
            {p.madeBy === 'ai' ? <Badge kind="ai">Options chosen by AI</Badge> : null}
            {p.flags
              .filter((f) => f !== 'address needs confirming')
              .map((f) => (
                <Badge key={f} kind="flag">
                  {f}
                </Badge>
              ))}
            {p.person.stale ? (
              <Badge kind="danger">Address last checked over a year ago</Badge>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={busy !== null || !p.approvable}
          title={
            p.blockReason === 'address_stale'
              ? 'Confirm the address in the editor first'
              : undefined
          }
          onClick={() =>
            run('approve', async () => {
              await api(`/api/proposals/${encodeURIComponent(p.key)}`, {
                method: 'PATCH',
                json: { action: 'approve' },
              });
              toast(`Approved ${first}'s card. It is on the Orders screen.`);
            })
          }
        >
          {busy === 'approve' ? 'Paying…' : `Approve and pay ${formatPence(p.quote.totalPence)}`}
        </button>
        <Link href={`/today?edit=${encodeURIComponent(p.key)}`} className="btn btn-sm">
          Edit
        </Link>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy !== null}
          onClick={() =>
            run('skip', async () => {
              await api(`/api/proposals/${encodeURIComponent(p.key)}`, {
                method: 'PATCH',
                json: { action: 'skip' },
              });
              toast(`Skipped ${first}'s card this year`);
            })
          }
        >
          Skip this year
        </button>
      </div>
      {p.blockReason === 'address_stale' ? (
        <p className="mt-2 text-xs text-amber">
          Approval is blocked until the address is confirmed. Open Edit and click &ldquo;Address is
          still right&rdquo;.
        </p>
      ) : null}
      <div className="mt-2">
        <ErrorNote message={error} />
      </div>
    </article>
  );
}
