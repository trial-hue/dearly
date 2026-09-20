'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const SORTS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'a-z', label: 'A to Z' },
  { value: 'newest', label: 'Newest' },
] as const;
export type SortValue = (typeof SORTS)[number]['value'];

export function SortSelect() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const value = params.get('sort') ?? 'recommended';
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-ink-2">Sort</span>
      <select
        className="input input-pill w-auto py-1.5"
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set('sort', e.target.value);
          router.replace(`${path}?${next.toString()}`, { scroll: false });
        }}
        aria-label="Sort cards"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}
