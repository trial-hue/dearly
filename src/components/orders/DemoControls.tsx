'use client';

import { useToast } from '@/components/shell/Toast';
import { ErrorNote } from '@/components/ui';
import { api, useAction } from '@/lib/fetcher';

/** Collapsed by default: the demo levers that would be the worker and the carrier in production. */
export function DemoControls({
  openCount,
  delayable,
}: {
  openCount: number;
  delayable: { id: string; name: string }[];
}) {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  return (
    <details className="rounded-[12px] bg-surface-2 p-3 text-sm" data-testid="demo-controls">
      <summary
        className="cursor-pointer select-none font-semibold text-ink-2"
        data-testid="demo-toggle"
      >
        Demo controls
      </summary>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-sm"
          disabled={busy !== null || openCount === 0}
          data-testid="run-next-step"
          onClick={() =>
            run('advance', async () => {
              const r = await api<{ moved: number }>('/api/orders/advance', { json: {} });
              toast(`${r.moved} ${r.moved === 1 ? 'order' : 'orders'} moved one step`);
            })
          }
        >
          {busy === 'advance' ? 'Running…' : 'Run the next step'}
        </button>
        {delayable.map((o) => (
          <button
            key={o.id}
            type="button"
            className="btn btn-sm"
            disabled={busy !== null}
            data-testid="delay"
            data-order={o.id}
            onClick={() =>
              run(`delay-${o.id}`, async () => {
                await api(`/api/orders/${o.id}/delay`, { json: {} });
                toast('Delay triggered. Recovery has run.');
              })
            }
          >
            Simulate a postal delay: {o.name.split(' ')[0]}
          </button>
        ))}
        <span className="text-xs text-ink-2">
          In production the worker and the carrier do this.
        </span>
      </div>
      <ErrorNote message={error} />
    </details>
  );
}
