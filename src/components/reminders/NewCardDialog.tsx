'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ErrorNote, Field } from '@/components/ui';
import { Dialog } from '@/components/ui/Dialog';
import type { OccasionType } from '@/domain';
import { api, useAction } from '@/lib/fetcher';
import { ALL_OCCASIONS, OCCASION_LABELS } from '@/lib/occasions';

/** "New card": an occasion for someone on a date, then straight into Personalise. */
export function NewCardDialog({ people }: { people: { id: string; name: string }[] }) {
  const router = useRouter();
  const { run, busy, error } = useAction();
  const [open, setOpen] = useState(false);
  const [personId, setPersonId] = useState(people[0]?.id ?? '');
  const [type, setType] = useState<OccasionType>('thank_you');
  const [date, setDate] = useState(() =>
    new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
  );
  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setOpen(true)}
        data-testid="new-card-open"
      >
        <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
        New card
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Send a card to someone"
        testId="new-card-dialog"
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              'new',
              async () => {
                const view = await api<{ key: string }>('/api/proposals', {
                  json: { personId, type, date },
                });
                router.push(`/personalise/${encodeURIComponent(view.key)}?from=reminder`);
              },
              { refresh: false },
            );
          }}
        >
          <Field label="Who is it for" htmlFor="new-person">
            <select
              id="new-person"
              className="input"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Occasion" htmlFor="new-type">
              <select
                id="new-type"
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value as OccasionType)}
              >
                {ALL_OCCASIONS.map((k) => (
                  <option key={k} value={k}>
                    {OCCASION_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date" htmlFor="new-date">
              <input
                id="new-date"
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Field>
          </div>
          <ErrorNote message={error} />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy !== null || !personId}>
              {busy ? 'Setting up…' : 'Personalise it'}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
