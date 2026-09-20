'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { Tag } from '@/catalogue';

export interface ChipGroup {
  label: string;
  param: string;
  options: { value: string; label: string }[];
  multi?: boolean;
}

/** Pill filters that write to the URL, so results are shareable and the grid stays server-rendered. */
export function FilterChips({ groups, resultCount }: { groups: ChipGroup[]; resultCount: number }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const toggle = (param: string, value: string, multi: boolean) => {
    const next = new URLSearchParams(params.toString());
    const current = next.getAll(param);
    next.delete(param);
    if (multi) {
      const set = new Set(current);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      for (const v of set) next.append(param, v);
    } else if (current[0] !== value) next.set(param, value);
    router.replace(`${path}?${next.toString()}`, { scroll: false });
  };
  const clear = () => router.replace(path, { scroll: false });
  const active = groups.some((g) => params.getAll(g.param).length > 0);
  return (
    <div
      className="sticky top-[57px] z-10 -mx-4 border-b border-line bg-surface/95 px-4 py-2 backdrop-blur md:top-[65px] md:mx-0 md:px-0"
      data-testid="filter-bar"
    >
      <div className="flex flex-wrap items-center gap-2">
        {groups.map((g) => (
          <fieldset key={g.param} className="contents">
            <legend className="sr-only">{g.label}</legend>
            {g.options.map((o) => {
              const on = params.getAll(g.param).includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  className="chip"
                  aria-pressed={on}
                  onClick={() => toggle(g.param, o.value, g.multi ?? true)}
                >
                  {o.label}
                </button>
              );
            })}
          </fieldset>
        ))}
        {active ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
            Clear
          </button>
        ) : null}
        <span className="ml-auto text-sm text-ink-2" data-testid="result-count">
          {resultCount} {resultCount === 1 ? 'card' : 'cards'}
        </span>
      </div>
    </div>
  );
}

export const WHO_FOR: { value: Tag; label: string }[] = [
  { value: 'for her', label: 'For her' },
  { value: 'for him', label: 'For him' },
  { value: 'for kids', label: 'For kids' },
];
export const STYLES: { value: Tag; label: string }[] = [
  { value: 'funny', label: 'Funny' },
  { value: 'cute', label: 'Cute' },
  { value: 'floral', label: 'Floral' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'photo upload', label: 'Photo upload' },
  { value: 'milestone', label: 'Milestone' },
];
