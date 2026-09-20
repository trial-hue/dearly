'use client';

export interface Step {
  id: string;
  label: string;
}

export function StepIndicator({
  steps,
  current,
  onSelect,
}: {
  steps: Step[];
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto" aria-label="Steps">
      {steps.map((s, i) => (
        <li key={s.id} className="flex items-center gap-1">
          <button
            type="button"
            className={`chip ${i < current ? 'text-success' : ''}`}
            aria-current={i === current ? 'step' : undefined}
            aria-pressed={i === current}
            data-testid={`step-${i + 1}`}
            onClick={() => onSelect(i)}
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${i === current ? 'bg-bg text-ink' : i < current ? 'bg-success text-bg' : 'bg-surface-2 text-ink-2'}`}
            >
              {i + 1}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
          {i < steps.length - 1 ? <span className="h-px w-3 bg-line" aria-hidden="true" /> : null}
        </li>
      ))}
    </ol>
  );
}
