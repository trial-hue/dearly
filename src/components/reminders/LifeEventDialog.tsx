'use client';

import { HeartHandshake } from 'lucide-react';
import { useState } from 'react';

import { ErrorNote } from '@/components/ui';
import { Dialog } from '@/components/ui/Dialog';
import { api, useAction } from '@/lib/fetcher';

interface Result {
  result: { personId: string | null; action: 'pause' | 'none'; reason: string };
  personName: string | null;
  alreadyPaused: boolean;
  applied: boolean;
}

/** "What's changed?": one sentence pauses cards before an awkward one goes out. */
export function LifeEventDialog() {
  const { run, busy, error } = useAction();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [applied, setApplied] = useState(false);
  const confirmPause = () =>
    run('pause', async () => {
      if (!result?.result.personId) return;
      await api('/api/people', {
        method: 'PATCH',
        json: { action: 'pause', id: result.result.personId, reason: result.result.reason },
      });
      setApplied(true);
    });
  return (
    <>
      <button type="button" className="btn" onClick={() => setOpen(true)} data-testid="life-open">
        <HeartHandshake size={18} strokeWidth={1.75} aria-hidden="true" />
        What&rsquo;s changed?
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Tell us what has changed"
        testId="life-dialog"
      >
        <p className="mb-2 text-sm text-ink-2">
          A bereavement, a separation, a falling out. We pause cards for that person so nothing
          lands at the wrong moment.
        </p>
        <textarea
          id="life-text"
          data-testid="life-text"
          className="input min-h-[80px]"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="What changed"
          placeholder="e.g. Uncle Peter passed away in June"
        />
        <div className="mt-2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy !== null || !text.trim()}
            data-testid="life-event-check"
            onClick={() =>
              run('life', async () => {
                setApplied(false);
                setResult(await api('/api/ai/life_event', { json: { text } }));
              })
            }
          >
            {busy === 'life' ? 'Reading…' : 'Let Dearly know'}
          </button>
        </div>
        {result ? (
          <div
            className="mt-3 rounded-[12px] bg-surface-2 p-3 text-sm"
            data-testid="life-event-result"
          >
            <p className="font-semibold">{result.personName ?? 'No one matched'}</p>
            <p className="mt-1 text-ink-2">
              {result.result.action === 'pause'
                ? applied
                  ? `We have paused cards for ${result.personName}. Nothing will be sent until you say so. We are sorry.`
                  : result.alreadyPaused
                    ? `${result.personName}'s cards were already paused, so nothing changed.`
                    : `Pause cards for ${result.personName}? Nothing changes until you confirm.`
                : `Nothing to pause: ${result.result.reason.toLowerCase()}.`}
            </p>
            {result.result.action === 'pause' && !applied && !result.alreadyPaused ? (
              <button
                type="button"
                className="btn btn-primary btn-sm mt-2"
                disabled={busy !== null}
                data-testid="life-confirm"
                onClick={confirmPause}
              >
                {busy === 'pause' ? 'Pausing…' : `Yes, pause cards for ${result.personName}`}
              </button>
            ) : null}
          </div>
        ) : null}
        <ErrorNote message={error} />
      </Dialog>
    </>
  );
}
