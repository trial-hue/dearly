'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export interface MegaColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export interface Category {
  label: string;
  href: string;
  columns?: MegaColumn[];
  feature?: React.ReactNode;
}

function MegaMenu({
  category,
  open,
  onOpen,
  onClose,
}: {
  category: Category;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <li
      ref={ref}
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node | null)) onClose();
      }}
    >
      <div className="flex items-center">
        <Link
          href={category.href}
          className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-surface-2"
        >
          {category.label}
        </Link>
        {category.columns ? (
          <button
            type="button"
            className="rounded-full p-1 hover:bg-surface-2"
            aria-expanded={open}
            aria-haspopup="true"
            aria-label={`Open ${category.label} menu`}
            onClick={() => (open ? onClose() : onOpen())}
          >
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              aria-hidden="true"
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
        ) : null}
      </div>
      {category.columns && open ? (
        <div className="absolute left-0 top-full z-30 mt-1 flex w-[min(720px,90vw)] gap-8 rounded-[12px] bg-surface p-6 shadow-[var(--shadow-tile-hover)]">
          {category.columns.map((col) => (
            <div key={col.heading} className="min-w-[140px]">
              <h3 className="mb-2 text-xs font-bold text-ink-2">{col.heading}</h3>
              <ul className="space-y-1">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="block rounded-md px-1 py-0.5 text-sm hover:underline"
                      onClick={onClose}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {category.feature ? (
            <div className="ml-auto w-[180px] shrink-0">{category.feature}</div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

/** One row of category links with mega-menus on desktop; a scrolling pill row on phones. */
export function CategoryNav({ categories }: { categories: Category[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const path = usePathname();
  return (
    <nav aria-label="Categories" className="border-b border-line bg-surface">
      <ul className="container-x hidden items-center gap-1 py-1 md:flex">
        {categories.map((c, i) => (
          <MegaMenu
            key={c.label}
            category={c}
            open={openIdx === i}
            onOpen={() => setOpenIdx(i)}
            onClose={() => setOpenIdx((cur) => (cur === i ? null : cur))}
          />
        ))}
      </ul>
      <ul className="scroll-x container-x py-2 md:hidden" style={{ gap: 8 }}>
        {categories.map((c) => (
          <li key={c.label}>
            <Link
              href={c.href}
              className="chip"
              aria-current={path === c.href ? 'page' : undefined}
            >
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
