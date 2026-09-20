'use client';

import { useState } from 'react';

import { useToast } from '@/components/shell/Toast';
import { Badge, ErrorNote } from '@/components/ui';
import { TITLES } from '@/domain';
import { api, useAction } from '@/lib/fetcher';
import { daysLabel, fmtDate } from '@/lib/format';
import type { Serialized } from '@/lib/serialize';
import type { PersonView } from '@/server/services/people';

export function PersonRow({ person: p }: { person: Serialized<PersonView> }) {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [pausing, setPausing] = useState(false);
  return (
    <li className="card" data-testid={`person-${p.id}`}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h3 className="font-bold">{p.name}</h3>
        <span className="muted text-sm">{p.relationship}</span>
        {p.pausedReason ? <Badge kind="flag">Paused: {p.pausedReason}</Badge> : null}
      </div>
      <p className="mt-1 text-sm">
        {p.address ? `${p.address}, ` : ''}
        {p.postcode ?? 'no postcode'}
        <span className={`ml-2 text-xs ${p.stale ? 'text-amber' : 'text-green'}`}>
          {p.addressDaysAgo == null
            ? 'Address never checked'
            : p.stale
              ? `Address last checked ${p.addressDaysAgo} days ago: needs confirming`
              : `Address checked ${daysLabel(-p.addressDaysAgo)}`}
        </span>
      </p>
      <ul className="mt-1 text-sm">
        {p.occasions.map((o) => (
          <li key={o.id} className="flex flex-wrap gap-x-2">
            <span>{TITLES[o.type]}</span>
            {o.nextDate ? (
              <span className="muted">
                {fmtDate(o.nextDate)}
                {o.daysLeft != null ? ` (${daysLabel(o.daysLeft)})` : ''}
                {o.age != null && (o.type === 'birthday' || o.type === 'anniversary')
                  ? `, ${o.age}`
                  : ''}
              </span>
            ) : (
              <span className="muted">no date yet</span>
            )}
          </li>
        ))}
      </ul>
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
                await api('/api/people', { method: 'PATCH', json: { action: 'resume', id: p.id } });
                toast(`Resumed cards for ${p.name}`);
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
              className="input w-48"
              placeholder="Reason, e.g. bereavement"
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
    </li>
  );
}
