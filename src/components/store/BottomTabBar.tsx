'use client';

import { Bell, House, Search, ShoppingBag, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useBasket } from '@/components/basket/basketStore';

const TABS = [
  { href: '/', label: 'Home', icon: House },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/cards', label: 'Search', icon: Search },
  { href: '/basket', label: 'Basket', icon: ShoppingBag },
  { href: '/account', label: 'Account', icon: UserRound },
];

/** Phone navigation: five tabs with icons and labels, fixed to the bottom under 768px. */
export function BottomTabBar() {
  const path = usePathname();
  const basket = useBasket();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom,0px)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const current = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${current ? 'text-primary' : 'text-ink-2'}`}
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                {label}
                {href === '/basket' && basket.count ? (
                  <span className="absolute right-[calc(50%-18px)] top-1 inline-flex min-w-[16px] justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
                    {basket.count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
