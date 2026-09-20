'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ThemeToggle } from './ThemeToggle';

const GROUPS = [
  {
    label: 'For customers',
    items: [
      { href: '/today', label: 'Today' },
      { href: '/studio', label: 'eCard studio' },
      { href: '/orders', label: 'Orders' },
      { href: '/inventory', label: 'Inventory' },
      { href: '/people', label: 'People' },
      { href: '/help', label: 'Help' },
    ],
  },
  {
    label: 'For business',
    items: [
      { href: '/business', label: 'Business sends' },
      { href: '/florists', label: 'Florist partners' },
    ],
  },
  { label: 'Behind the scenes', items: [{ href: '/operations', label: 'Operations' }] },
];

export function Nav({ aiMode, aiLabel }: { aiMode: 'ai' | 'rules'; aiLabel: string }) {
  const path = usePathname();
  return (
    <nav
      aria-label="Screens"
      className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-line bg-surface px-3 py-2 md:h-screen md:flex-col md:gap-0 md:overflow-y-auto md:border-b-0 md:border-r md:px-3 md:py-5"
    >
      <div className="hidden items-center gap-2 px-2 pb-5 md:flex">
        <svg width="26" height="20" viewBox="0 0 26 20" aria-hidden="true">
          <rect
            x="1"
            y="1"
            width="24"
            height="18"
            rx="2"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.6"
          />
          <path d="M1.5 2 L13 11 L24.5 2" fill="none" stroke="var(--red)" strokeWidth="1.6" />
        </svg>
        <span className="text-lg font-bold tracking-tight">Dearly</span>
        <span className="label ml-auto">pilot</span>
      </div>
      {GROUPS.map((g) => (
        <div key={g.label} className="flex shrink-0 items-center gap-1 md:mb-4 md:block">
          <h2 className="hidden px-2.5 pb-1 text-[11px] font-medium text-ink2 md:block">
            {g.label}
          </h2>
          {g.items.map((it) => {
            const current = path === it.href || path.startsWith(`${it.href}/`);
            return (
              <Link
                key={it.href}
                href={it.href}
                className="nav-link whitespace-nowrap md:whitespace-normal"
                aria-current={current ? 'page' : undefined}
              >
                {it.label}
              </Link>
            );
          })}
        </div>
      ))}
      <div className="ml-auto flex shrink-0 items-center gap-2 md:mt-auto md:flex-col md:items-stretch md:gap-3">
        <span
          className={`pill ${aiMode === 'ai' ? 'text-green' : 'text-amber'}`}
          title={
            aiMode === 'ai'
              ? 'AI jobs run through the configured provider'
              : 'No API key configured: every AI job runs on built-in rules'
          }
          data-testid="ai-status"
        >
          <span className={`pill-dot ${aiMode === 'ai' ? 'bg-green' : 'bg-amber'}`} />
          {aiLabel}
        </span>
        <ThemeToggle />
      </div>
    </nav>
  );
}
