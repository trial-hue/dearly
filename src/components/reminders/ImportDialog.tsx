'use client';

import { UserRoundPlus } from 'lucide-react';
import { useState } from 'react';

import { useToast } from '@/components/shell/Toast';
import { ErrorNote } from '@/components/ui';
import { Dialog } from '@/components/ui/Dialog';
import type { ImportedPerson } from '@/domain';
import { api, useAction } from '@/lib/fetcher';
import { OCCASION_LABELS } from '@/lib/occasions';

const PLACEHOLDER =
  'Jo Ellis, sister, birthday, 14 March 1990\nRavi Mehta, friend, diwali\nNan, grandmother, birthday, 2 Feb 1941';

/** Paste a list of people and dates; Dearly reads it, you check it, then add everyone at once. */
export function ImportDialog() {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<{ people: ImportedPerson[] } | null>(null);
  const close = () => {
    setOpen(false);
    setPreview(null);
  };
  return (
    <>
      <button type="button" className="btn" onClick={() => setOpen(true)} data-testid="import-open">
        <UserRoundPlus size={18} strokeWidth={1.75} aria-hidden="true" />
        Add people
      </button>
      <Dialog open={open} onClose={close} title="Add people and their dates" testId="import-dialog">
        <p className="mb-2 text-sm text-ink-2">
          One person per line: name, relationship, occasion, date. We read it and show you what we
          understood before anything is added.
        </p>
        <textarea
          id="import-text"
          data-testid="import-text"
          className="input min-h-[110px] font-mono text-xs"
          placeholder={PLACEHOLDER}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="People to add"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-sm"
            disabled={busy !== null || !text.trim()}
            data-testid="import-preview"
            onClick={() =>
              run(
                'preview',
                async () => setPreview(await api('/api/ai/import_people', { json: { text } })),
                { refresh: false },
              )
            }
          >
            {busy === 'preview' ? 'Reading…' : 'Check the list'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            data-testid="import-example"
            onClick={() => setText(PLACEHOLDER)}
          >
            Use an example
          </button>
        </div>
        {preview ? (
          <div className="mt-4">
            <p className="mb-1 text-sm font-semibold">{preview.people.length} found</p>
            <div className="tbl-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Relationship</th>
                    <th>Occasion</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.people.map((p, i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td>{p.relationship}</td>
                      <td>{OCCASION_LABELS[p.occasion]}</td>
                      <td>
                        {p.day && p.month
                          ? `${p.day}/${p.month}${p.year ? `/${p.year}` : ''}`
                          : 'from the calendar'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm mt-3"
              disabled={busy !== null || preview.people.length === 0}
              data-testid="import-add-all"
              onClick={() =>
                run('add', async () => {
                  const r = await api<{ added: number }>('/api/people', {
                    json: { people: preview.people },
                  });
                  toast(`Added ${r.added} ${r.added === 1 ? 'person' : 'people'}`);
                  setText('');
                  close();
                })
              }
            >
              Add all
            </button>
          </div>
        ) : null}
        <ErrorNote message={error} />
      </Dialog>
    </>
  );
}
