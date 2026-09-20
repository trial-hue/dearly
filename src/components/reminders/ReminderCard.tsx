'use client';

import Link from 'next/link';

import { CardMock } from '@/components/card/CardMock';
import { useToast } from '@/components/shell/Toast';
import { ErrorNote } from '@/components/ui';
import { ordinal } from '@/domain';
import { api, useAction } from '@/lib/fetcher';
import { daysLabel, fmtDate, formatPence } from '@/lib/format';
import { OCCASION_LABELS } from '@/lib/occasions';
import type { Serialized } from '@/lib/serialize';
import type { ProposalView } from '@/server/services/proposals';

export type ProposalDTO = Serialized<ProposalView>;

export function reminderHeadline(p: Pick<ProposalDTO, 'person' | 'occasionType' | 'age'>): string {
  const first = p.person.name.includes(' and ')
    ? p.person.name
    : (p.person.name.split(' ')[0] ?? p.person.name);
  const who = first.endsWith('s') ? `${first}'` : `${first}'s`;
  if (p.occasionType === 'birthday')
    return `${who} ${p.age != null ? `${ordinal(p.age)} ` : ''}birthday`;
  if (p.occasionType === 'anniversary')
    return `${who} ${p.age != null ? `${ordinal(p.age)} ` : ''}anniversary`;
  if (p.occasionType === 'leaving') return `${who} leaving card`;
  if (p.occasionType === 'thank_you') return `A thank you for ${first}`;
  if (p.occasionType === 'work_anniversary')
    return `${who} ${p.age != null ? `${ordinal(p.age)} ` : ''}work anniversary`;
  return `${OCCASION_LABELS[p.occasionType]} for ${first}`;
}

/** One reminder: the card, what it is, when, the drafted line, the price and three actions. */
export function ReminderCard({
  proposal: p,
  compact = false,
}: {
  proposal: ProposalDTO;
  compact?: boolean;
}) {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  const first = p.person.name.split(' ')[0] ?? p.person.name;
  const key = encodeURIComponent(p.key);
  return (
    <article
      className={`tile flex ${compact ? 'w-[300px] flex-col' : 'flex-col sm:flex-row'} gap-4 p-4`}
      data-testid={`reminder-${p.person.id}`}
      aria-labelledby={`r-${p.id}`}
    >
      <div className={compact ? 'w-full' : 'w-[180px] shrink-0'}>
        <CardMock card={p.card} title={p.title} name={first} age={p.age} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 id={`r-${p.id}`} className="t-h3">
          {reminderHeadline(p)}
        </h3>
        <p className="text-sm text-ink-2">
          {fmtDate(p.dueDate)}, {daysLabel(p.daysLeft)}
        </p>
        <p className="mt-2 truncate font-hand text-[19px] leading-tight" title={p.card.message}>
          {p.card.message}
        </p>
        <p className="mt-1 text-sm">
          {p.card.mode === 'ecard' ? 'Sent by link on the day' : `Arrives by ${fmtDate(p.arrival)}`}
        </p>
        {p.messageBy === 'ai' || p.madeBy === 'ai' ? (
          <p className="mt-1 text-xs font-semibold text-success">
            {p.messageBy === 'ai' ? 'Drafted for you' : `Picked for ${first}`}
          </p>
        ) : null}
        {p.blockReason === 'address_stale' ? (
          <p className="mt-2 text-sm text-ink-2">
            We last checked {first}&rsquo;s address over a year ago.{' '}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() =>
                run('confirm', async () => {
                  await api(`/api/proposals/${key}`, {
                    method: 'PATCH',
                    json: { action: 'confirm_address' },
                  });
                  toast('Address confirmed');
                })
              }
            >
              It&rsquo;s still right
            </button>
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <span className="t-price mr-1">{formatPence(p.quote.totalPence)}</span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            data-testid="reminder-approve"
            disabled={busy !== null || !p.approvable}
            onClick={() =>
              run('approve', async () => {
                await api(`/api/proposals/${key}`, {
                  method: 'PATCH',
                  json: { action: 'approve' },
                });
                toast(`Approved. ${first}'s card is on its way.`);
              })
            }
          >
            {busy === 'approve' ? 'Paying…' : `Approve and pay ${formatPence(p.quote.totalPence)}`}
          </button>
          <Link
            href={`/personalise/${key}?from=reminder`}
            className="btn btn-sm"
            data-testid="reminder-edit"
          >
            Personalise
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            data-testid="reminder-skip"
            disabled={busy !== null}
            onClick={() =>
              run('skip', async () => {
                await api(`/api/proposals/${key}`, { method: 'PATCH', json: { action: 'skip' } });
                toast(`Skipped ${first}'s card this year`);
              })
            }
          >
            Skip this year
          </button>
        </div>
        <ErrorNote message={error} />
      </div>
    </article>
  );
}
