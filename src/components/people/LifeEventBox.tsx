'use client';

import { useState } from 'react';

import { Badge, ErrorNote } from '@/components/ui';
import { api, useAction } from '@/lib/fetcher';

interface Result {
  result: { personId: string | null; action: 'pause' | 'none'; reason: string };
  by: 'ai' | 'rule';
  personName: string | null;
  alreadyPaused: boolean;
  applied: boolean;
}

export function LifeEventBox() {
  const { run, busy, error } = useAction();
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  return (
    <section className="card" aria-labelledby="life-title">
      <h2 id="life-title" className="font-bold">
        Tell Dearly what changed
      </h2>
      <p className="muted text-sm">
        The life-event guard pauses cards before an awkward one goes out. Try &ldquo;Uncle Peter
        passed away in June&rdquo; or &ldquo;Priya and Tom have split up&rdquo;.
      </p>
      <textarea
        id="life-text"
        data-testid="life-text"
        className="input mt-2 min-h-[72px]"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="What changed"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="btn btn-sm"
          disabled={busy !== null || !text.trim()}
          data-testid="life-event-check"
          onClick={() =>
            run('life', async () => setResult(await api('/api/ai/life_event', { json: { text } })))
          }
        >
          {busy === 'life' ? 'Checking…' : 'Check'}
        </button>
      </div>
      {result ? (
        <div className="mt-3 rounded-md bg-surface2 p-3 text-sm" data-testid="life-event-result">
          <div className="flex flex-wrap items-center gap-2">
            {result.by === 'ai' ? (
              <Badge kind="ai">Read by AI</Badge>
            ) : (
              <Badge>Built-in rules</Badge>
            )}
            <span className="font-medium">{result.personName ?? 'No matching person'}</span>
          </div>
          <p className="mt-1">
            {result.result.action === 'pause'
              ? result.applied
                ? `Cards for ${result.personName} are paused: ${result.result.reason.toLowerCase()}. Nothing will be proposed until you resume them.`
                : result.alreadyPaused
                  ? `${result.personName} is already paused, so nothing changed.`
                  : 'No change was made.'
              : `No pause needed: ${result.result.reason.toLowerCase()}.`}
          </p>
        </div>
      ) : null}
      <ErrorNote message={error} />
    </section>
  );
}
