'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';

import { TITLES } from '@/domain';
import { OCCASION_LABELS, OCCASION_SLUGS } from '@/lib/occasions';

export interface Suggestion {
  label: string;
  href: string;
  kind: 'occasion' | 'design' | 'tag';
}

const OCCASION_SUGGESTIONS: Suggestion[] = (Object.keys(TITLES) as (keyof typeof TITLES)[]).map(
  (t) => ({
    label: OCCASION_LABELS[t],
    href: `/cards/${OCCASION_SLUGS[t]}`,
    kind: 'occasion' as const,
  }),
);

/** A large rounded search field with suggestions; Enter searches the catalogue. */
export function SearchField({
  extra = [],
  compact = false,
  autoFocus = false,
}: {
  extra?: Suggestion[];
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const listId = useId();
  const all = [...OCCASION_SUGGESTIONS, ...extra];
  const matches =
    q.trim().length > 0
      ? all.filter((s) => s.label.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 7)
      : [];
  const go = (href: string) => {
    setOpen(false);
    setQ('');
    router.push(href);
  };
  return (
    <form
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        go(matches[0]?.href ?? `/cards?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <label htmlFor="header-search" className="sr-only">
        Search cards
      </label>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-2"
        size={20}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <input
        id="header-search"
        data-testid="header-search"
        className={`input input-pill pl-11 ${compact ? 'py-2' : 'py-3 text-base'}`}
        placeholder="Search cards, occasions, styles"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {open && matches.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[12px] bg-surface p-1 shadow-[var(--shadow-tile-hover)]"
        >
          {matches.map((s) => (
            <li key={s.href + s.label} role="option" aria-selected={false}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-sm hover:bg-surface-2"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(s.href)}
              >
                <span>{s.label}</span>
                <span className="text-xs text-ink-2">
                  {s.kind === 'occasion' ? 'Occasion' : s.kind === 'design' ? 'Card' : 'Style'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
