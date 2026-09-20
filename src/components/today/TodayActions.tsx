'use client';

import Link from 'next/link';

import { useToast } from '@/components/shell/Toast';
import { ErrorNote } from '@/components/ui';
import { api, useAction } from '@/lib/fetcher';

export function TodayActions({ openCount }: { openCount: number }) {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy !== null || openCount === 0}
          onClick={() =>
            run('draft', async () => {
              const r = await api<{ by: 'ai' | 'rule'; count: number; provider: string | null }>(
                '/api/ai/proposals',
                { json: {} },
              );
              toast(
                r.by === 'ai'
                  ? `Drafted ${r.count} cards with ${r.provider}`
                  : `Drafted ${r.count} cards with the built-in rules`,
              );
            })
          }
        >
          {busy === 'draft' ? 'Drafting…' : 'Draft all with AI'}
        </button>
        <Link href="/today?new=1" className="btn">
          New card
        </Link>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy !== null}
          onClick={() => {
            if (
              !window.confirm(
                'Reset the demo? Every order, proposal and edit goes back to the seeded state.',
              )
            )
              return;
            void run('reset', async () => {
              await api('/api/demo/reset', { json: {} });
              toast('Demo reset');
            });
          }}
        >
          {busy === 'reset' ? 'Resetting…' : 'Reset demo'}
        </button>
      </div>
      <ErrorNote message={error} />
    </div>
  );
}
