'use client';

import { DESIGNS, type DesignId } from '@/domain';

import { CardArt } from './CardArt';

export function DesignPicker({
  value,
  onChange,
  title,
  name,
  age,
}: {
  value: DesignId;
  onChange: (d: DesignId) => void;
  title: string;
  name: string;
  age: number | null;
}) {
  return (
    <div role="radiogroup" aria-label="Design" className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {DESIGNS.map((d) => (
        <button
          key={d}
          type="button"
          role="radio"
          aria-checked={value === d}
          aria-label={d}
          onClick={() => onChange(d)}
          className={`paper rounded-md p-0.5 ring-offset-2 ring-offset-surface ${value === d ? 'ring-2 ring-ink' : 'hover:ring-2 hover:ring-line'}`}
        >
          <CardArt design={d} title={title} name={name} age={age} />
        </button>
      ))}
    </div>
  );
}
