'use client';

import { useState } from 'react';

import { useToast } from '@/components/shell/Toast';
import { Badge, ErrorNote } from '@/components/ui';
import { TITLES, type FloristReading } from '@/domain';
import { api, useAction } from '@/lib/fetcher';
import { formatPence } from '@/lib/format';

export function FloristWorkbench({ sample }: { sample: string }) {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  const [text, setText] = useState(sample);
  const [reading, setReading] = useState<{ reading: FloristReading; by: 'ai' | 'rule' } | null>(
    null,
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card">
        <label htmlFor="florist-text" className="text-xs font-medium text-ink2">
          Order text from the florist&rsquo;s system
        </label>
        <textarea
          id="florist-text"
          className="input mt-1 min-h-[150px] font-mono text-xs"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy !== null || !text.trim()}
            data-testid="read-order"
            onClick={() =>
              run(
                'read',
                async () => setReading(await api('/api/ai/read_florist_order', { json: { text } })),
                { refresh: false },
              )
            }
          >
            {busy === 'read' ? 'Reading…' : 'Read this order'}
          </button>
        </div>
        <ErrorNote message={error} />
      </section>
      <section className="card" data-testid="florist-reading">
        <h2 className="font-bold">What Dearly read</h2>
        {reading ? (
          <>
            <div className="mt-1">
              {reading.by === 'ai' ? (
                <Badge kind="ai">Read by AI</Badge>
              ) : (
                <Badge>Built-in rules</Badge>
              )}
            </div>
            <dl className="mt-2 grid grid-cols-[120px_1fr] gap-y-1 text-sm">
              <dt className="muted">Recipient</dt>
              <dd>{reading.reading.recipient}</dd>
              <dt className="muted">Relationship</dt>
              <dd>
                {reading.reading.relationship} of {reading.reading.customer ?? 'the customer'}
              </dd>
              <dt className="muted">Occasion</dt>
              <dd>
                {TITLES[reading.reading.occasion]}
                {reading.reading.age ? `, turning ${reading.reading.age}` : ''}
              </dd>
              <dt className="muted">Date</dt>
              <dd>{reading.reading.date ?? 'unknown'}</dd>
              <dt className="muted">Basket</dt>
              <dd>
                {reading.reading.basketPence ? formatPence(reading.reading.basketPence) : 'unknown'}
              </dd>
            </dl>
            <button
              type="button"
              className="btn btn-primary btn-sm mt-3"
              disabled={busy !== null}
              data-testid="claim-referral"
              onClick={() =>
                run('claim', async () => {
                  await api('/api/partners/referral', {
                    json: { reading: reading.reading, readBy: reading.by },
                  });
                  toast('Reminder set for next year and the free first card claimed');
                  setReading(null);
                })
              }
            >
              Add reminder and claim the free first card
            </button>
          </>
        ) : (
          <p className="muted mt-1 text-sm">
            Read the order to see the recipient, relationship, occasion, date and age.
          </p>
        )}
      </section>
    </div>
  );
}
