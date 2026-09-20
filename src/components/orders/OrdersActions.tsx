'use client';

import { useToast } from '@/components/shell/Toast';
import { ErrorNote } from '@/components/ui';
import { api, useAction } from '@/lib/fetcher';

export function OrdersActions({ openCount }: { openCount: number }) {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy !== null || openCount === 0}
        data-testid="run-next-step"
        onClick={() =>
          run('advance', async () => {
            const r = await api<{ moved: number; jobs: number }>('/api/orders/advance', {
              json: {},
            });
            toast(
              `${r.moved} ${r.moved === 1 ? 'order' : 'orders'} moved one step${r.jobs ? `, ${r.jobs} scheduled job ran` : ''}`,
            );
          })
        }
      >
        {busy ? 'Running…' : 'Run the next step'}
      </button>
      <p className="muted text-xs">
        {openCount} open. In production the worker runs this on its own.
      </p>
      <ErrorNote message={error} />
    </div>
  );
}
