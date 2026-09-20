'use client';

import { Bell, Search, ShoppingBag, UserRound } from 'lucide-react';
import Link from 'next/link';

import { useBasket } from '@/components/basket/basketStore';

import { Logo } from './Logo';
import { SearchField, type Suggestion } from './SearchField';

function IconLink({
  href,
  icon,
  label,
  badge,
  testId,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  testId?: string;
}) {
  return (
    <Link href={href} className="btn btn-icon relative" data-testid={testId}>
      <span className="relative">
        {icon}
        {badge ? (
          <span
            className="absolute -right-2 -top-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-on-primary"
            data-testid="basket-count"
          >
            {badge}
          </span>
        ) : null}
      </span>
      <span>{label}</span>
    </Link>
  );
}

/** Storefront header: logo, large search, then Reminders, Account and Basket with labels. */
export function Header({ suggestions = [] }: { suggestions?: Suggestion[] }) {
  const basket = useBasket();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="container-x flex items-center gap-3 py-2 md:gap-6 md:py-3">
        <Logo />
        <div className="hidden min-w-0 flex-1 md:block">
          <SearchField extra={suggestions} />
        </div>
        <nav aria-label="Account" className="ml-auto flex items-center gap-0.5 md:gap-1">
          <Link href="/cards" className="btn btn-icon md:hidden" aria-label="Search">
            <Search size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>Search</span>
          </Link>
          <span className="hidden md:contents">
            <IconLink
              href="/reminders"
              icon={<Bell size={20} strokeWidth={1.75} aria-hidden="true" />}
              label="Reminders"
            />
            <IconLink
              href="/account"
              icon={<UserRound size={20} strokeWidth={1.75} aria-hidden="true" />}
              label="Account"
            />
          </span>
          <IconLink
            href="/basket"
            icon={<ShoppingBag size={20} strokeWidth={1.75} aria-hidden="true" />}
            label="Basket"
            badge={basket.count}
            testId="basket-link"
          />
        </nav>
      </div>
    </header>
  );
}
