'use client';

import { useState } from 'react';

import { useToast } from '@/components/shell/Toast';
import { ErrorNote } from '@/components/ui';
import { api, useAction } from '@/lib/fetcher';
import { daysLabel, fmtDate } from '@/lib/format';
import { OCCASION_LABELS } from '@/lib/occasions';
import type { Serialized } from '@/lib/serialize';
import type { PersonView } from '@/server/services/people';

function initials(name: string): string {
  return name
    .split(/\s+and\s+|\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

const AVATARS = ['bg-blush', 'bg-butter', 'bg-mint', 'bg-sky', 'bg-lilac'];

/** One person: initials, relationship, next occasion, address status, pause. */
export function PersonRow({
  person: p,
  index = 0,
}: {
  person: Serialized<PersonView>;
  index?: number;
}) {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [pausing, setPausing] = useState(false);
  const next = [...p.occasions]
    .filter((o) => o.daysLeft != null)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))[0];
  return (
    <li className="flex gap-3 rounded-[12px] bg-surface-2 p-3" data-testid={`person-${p.id}`}>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${AVATARS[index % AVATARS.length]}`}
        aria-hidden="true"
      >
        {initials(p.name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-bold">{p.name}</span>
          <span className="text-sm text-ink-2">{p.relationship}</span>
        </div>
        {p.pausedReason ? (
          <p className="text-sm text-ink-2">
            Cards are paused for now. Resume whenever it feels right.
          </p>
        ) : next?.nextDate ? (
          <p className="text-sm">
            {OCCASION_LABELS[next.type]} {fmtDate(next.nextDate)}, {daysLabel(next.daysLeft ?? 0)}
            {next.age != null && (next.type === 'birthday' || next.type === 'anniversary')
              ? ` (${next.age})`
              : ''}
          </p>
        ) : (
          <p className="text-sm text-ink-2">No date yet</p>
        )}
        <p className={`text-xs ${p.stale ? 'text-warning' : 'text-ink-2'}`}>
          {p.postcode ?? 'No postcode'} ·{' '}
          {p.addressDaysAgo == null
            ? 'address not checked yet'
            : p.stale
              ? 'address needs a check'
              : 'address checked'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {p.stale ? (
            <button
              type="button"
              className="btn btn-sm"
              disabled={busy !== null}
              onClick={() =>
                run('confirm', async () => {
                  await api('/api/people', {
                    method: 'PATCH',
                    json: { action: 'confirm_address', id: p.id },
                  });
                  toast('Address confirmed');
                })
              }
            >
              Address is still right
            </button>
          ) : null}
          {p.pausedReason ? (
            <button
              type="button"
              className="btn btn-sm"
              disabled={busy !== null}
              onClick={() =>
                run('resume', async () => {
                  await api('/api/people', {
                    method: 'PATCH',
                    json: { action: 'resume', id: p.id },
                  });
                  toast(`Cards for ${p.name} are back on`);
                })
              }
            >
              Resume cards
            </button>
          ) : pausing ? (
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void run('pause', async () => {
                  await api('/api/people', {
                    method: 'PATCH',
                    json: { action: 'pause', id: p.id, reason: reason || 'Paused by you' },
                  });
                  toast(`Paused cards for ${p.name}`);
                  setPausing(false);
                });
              }}
            >
              <input
                className="input w-44 py-1"
                placeholder="Why, in a word or two"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                aria-label="Reason for pausing"
              />
              <button type="submit" className="btn btn-sm">
                Pause
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPausing(false)}
              >
                Cancel
              </button>
            </form>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPausing(true)}>
              Pause cards
            </button>
          )}
        </div>
        <ErrorNote message={error} />
      </div>
    </li>
  );
}
