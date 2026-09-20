'use client';

import { Sparkles } from 'lucide-react';

import { useToast } from '@/components/shell/Toast';
import { ErrorNote } from '@/components/ui';
import { api, useAction } from '@/lib/fetcher';

export function DraftAllButton({ count }: { count: number }) {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  return (
    <div>
      <button
        type="button"
        className="btn"
        data-testid="draft-all"
        disabled={busy !== null || count === 0}
        onClick={() =>
          run('draft', async () => {
            const r = await api<{ count: number }>('/api/ai/proposals', { json: {} });
            toast(`Drafted ${r.count} cards for you`);
          })
        }
      >
        <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />
        {busy === 'draft' ? 'Drafting…' : 'Draft all with AI'}
      </button>
      <ErrorNote message={error} />
    </div>
  );
}
