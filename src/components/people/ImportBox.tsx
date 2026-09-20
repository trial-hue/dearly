'use client';

import { useState } from 'react';

import { useToast } from '@/components/shell/Toast';
import { Badge, ErrorNote } from '@/components/ui';
import { TITLES, type ImportedPerson } from '@/domain';
import { api, useAction } from '@/lib/fetcher';

const PLACEHOLDER =
  'Jo Ellis, sister, birthday, 14 March 1990\nRavi Mehta, friend, diwali\nNan, grandmother, birthday, 2 Feb 1941';

export function ImportBox() {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<{ people: ImportedPerson[]; by: 'ai' | 'rule' } | null>(
    null,
  );
  return (
    <section className="card" aria-labelledby="import-title">
      <h2 id="import-title" className="font-bold">
        Import people
      </h2>
      <p className="muted text-sm">
        One person per line: name, relationship, occasion, date. The AI structures it; without a key
        the built-in parser does.
      </p>
      <textarea
        id="import-text"
        data-testid="import-text"
        className="input mt-2 min-h-[96px] font-mono text-xs"
        placeholder={PLACEHOLDER}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="People to import"
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
          {busy === 'preview' ? 'Reading…' : 'Preview'}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          data-testid="import-example"
          onClick={() => setText(PLACEHOLDER)}
        >
          Use the example
        </button>
      </div>
      {preview ? (
        <div className="mt-3">
          <div className="mb-1 flex items-center gap-2 text-sm">
            <span className="font-medium">{preview.people.length} found</span>
            {preview.by === 'ai' ? (
              <Badge kind="ai">Read by AI</Badge>
            ) : (
              <Badge>Built-in rules</Badge>
            )}
          </div>
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
                    <td>{TITLES[p.occasion]}</td>
                    <td>
                      {p.day && p.month
                        ? `${p.day}/${p.month}${p.year ? `/${p.year}` : ''}`
                        : 'from the feast calendar'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm mt-2"
            disabled={busy !== null || preview.people.length === 0}
            data-testid="import-add-all"
            onClick={() =>
              run('add', async () => {
                const r = await api<{ added: number }>('/api/people', {
                  json: { people: preview.people },
                });
                toast(`Added ${r.added} ${r.added === 1 ? 'person' : 'people'}`);
                setPreview(null);
                setText('');
              })
            }
          >
            Add all
          </button>
        </div>
      ) : null}
      <ErrorNote message={error} />
    </section>
  );
}
