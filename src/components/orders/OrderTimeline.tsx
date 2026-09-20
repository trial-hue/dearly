import { Check } from 'lucide-react';

import { STAGE_LABELS, type Stage } from '@/domain';

/** A horizontal stepper: done, current and upcoming stages. */
export function OrderTimeline({ stages, current }: { stages: readonly Stage[]; current: Stage }) {
  const idx = stages.indexOf(current);
  return (
    <ol className="flex items-center gap-1 overflow-x-auto py-1" aria-label="Progress">
      {stages.map((s, i) => {
        const state = i < idx ? 'done' : i === idx ? 'now' : 'next';
        return (
          <li key={s} className="flex shrink-0 items-center gap-1">
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${state === 'done' ? 'bg-success-bg text-success' : state === 'now' ? 'bg-ink text-bg' : 'bg-surface-2 text-ink-2'}`}
              aria-current={state === 'now' ? 'step' : undefined}
              data-testid={state === 'now' ? 'stage-current' : undefined}
            >
              {state === 'done' ? <Check size={12} strokeWidth={2.5} aria-hidden="true" /> : null}
              {STAGE_LABELS[s] ?? s}
            </span>
            {i < stages.length - 1 ? (
              <span
                className={`h-px w-4 ${i < idx ? 'bg-success' : 'bg-line'}`}
                aria-hidden="true"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
