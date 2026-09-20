'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ErrorNote, Field } from '@/components/ui';
import { TITLES } from '@/domain';
import { api, useAction } from '@/lib/fetcher';

export function NewCardForm({ people }: { people: { id: string; name: string }[] }) {
  const router = useRouter();
  const { run, busy, error } = useAction();
  const [personId, setPersonId] = useState(people[0]?.id ?? '');
  const [type, setType] = useState('thank_you');
  const [date, setDate] = useState(() =>
    new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
  );
  return (
    <form
      className="card mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        void run('new', async () => {
          const view = await api<{ key: string }>('/api/proposals', {
            json: { personId, type, date },
          });
          router.push(`/personalise/${encodeURIComponent(view.key)}?from=reminder`);
        });
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
      <Field label="Occasion" htmlFor="new-type">
        <select
          id="new-type"
          className="input"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {Object.entries(TITLES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
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
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={busy !== null || !personId}>
          Create the card
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => router.push('/reminders')}>
          Cancel
        </button>
      </div>
      <div className="sm:col-span-4">
        <ErrorNote message={error} />
      </div>
    </form>
  );
}
