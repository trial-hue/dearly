'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { renderDesignSvg, type DesignDef } from '@/catalogue';
import { ErrorNote, Field } from '@/components/ui';
import { Dialog } from '@/components/ui/Dialog';
import { TITLES, type Finish, type OccasionType, type Size } from '@/domain';
import { api, useAction } from '@/lib/fetcher';
import { OCCASION_LABELS } from '@/lib/occasions';
import type { Serialized } from '@/lib/serialize';
import type { PersonView } from '@/server/services/people';

type PersonDTO = Serialized<PersonView>;

/** Who is the card for? Picks a person and a date, creates the proposal with this design, opens Personalise. */
export function RecipientDialog({
  open,
  onClose,
  design,
  size,
  finish,
}: {
  open: boolean;
  onClose: () => void;
  design: DesignDef;
  size: Size;
  finish: Finish;
}) {
  const router = useRouter();
  const { run, busy, error } = useAction();
  const [people, setPeople] = useState<PersonDTO[] | null>(null);
  const [personId, setPersonId] = useState('');
  const [occasion, setOccasion] = useState<OccasionType>(design.occasions[0] ?? 'birthday');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (!open || people) return;
    let cancelled = false;
    api<PersonDTO[]>('/api/people').then((rows) => {
      if (cancelled) return;
      const active = rows.filter((p) => !p.pausedReason);
      setPeople(active);
      const first = active[0];
      if (first) {
        setPersonId(first.id);
        setDate(defaultDate(first, design.occasions[0] ?? 'birthday'));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, people, design.occasions]);

  const person = people?.find((p) => p.id === personId) ?? null;
  const choosePerson = (id: string) => {
    setPersonId(id);
    const p = people?.find((x) => x.id === id);
    if (p) setDate(defaultDate(p, occasion));
  };
  const chooseOccasion = (o: OccasionType) => {
    setOccasion(o);
    if (person) setDate(defaultDate(person, o));
  };

  const cont = () =>
    run(
      'create',
      async () => {
        if (!person) return;
        const view = await api<{ key: string; person: { name: string }; age: number | null }>(
          '/api/proposals',
          { json: { personId: person.id, type: occasion, date } },
        );
        const first = person.name.includes(' and ')
          ? person.name
          : (person.name.split(' ')[0] ?? person.name);
        const svg = renderDesignSvg(design, {
          title: TITLES[occasion],
          name: first,
          age: view.age,
        });
        await api(`/api/proposals/${encodeURIComponent(view.key)}`, {
          method: 'PATCH',
          json: { action: 'edit', patch: { size, finish, customFront: { kind: 'svg', svg } } },
        });
        router.push(`/personalise/${encodeURIComponent(view.key)}?from=shop`);
      },
      { refresh: false },
    );

  return (
    <Dialog open={open} onClose={onClose} title="Who is this card for?" testId="recipient-dialog">
      {people === null ? (
        <div className="skeleton h-32" aria-busy="true" />
      ) : people.length === 0 ? (
        <p className="text-sm text-ink-2">
          Add someone under Reminders first, then come back to this card.
        </p>
      ) : (
        <div className="space-y-4">
          <Field label="Send to" htmlFor="recipient-select">
            <select
              id="recipient-select"
              className="input"
              value={personId}
              onChange={(e) => choosePerson(e.target.value)}
              data-testid="recipient-select"
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.relationship})
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Occasion" htmlFor="recipient-occasion">
              <select
                id="recipient-occasion"
                className="input"
                value={occasion}
                onChange={(e) => chooseOccasion(e.target.value as OccasionType)}
              >
                {[
                  ...new Set([
                    ...design.occasions,
                    ...(person?.occasions.map((o) => o.type) ?? []),
                    'thank_you' as OccasionType,
                  ]),
                ].map((o) => (
                  <option key={o} value={o}>
                    {OCCASION_LABELS[o]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date" htmlFor="recipient-date">
              <input
                id="recipient-date"
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
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy !== null || !person || !date}
              data-testid="recipient-continue"
              onClick={() => void cont()}
            >
              {busy ? 'Setting up…' : 'Personalise this card'}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function defaultDate(person: PersonDTO, occasion: OccasionType): string {
  const own = person.occasions.find((o) => o.type === occasion && o.nextDate);
  if (own?.nextDate) return own.nextDate.slice(0, 10);
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}
