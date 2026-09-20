'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/business', label: 'Overview' },
  { href: '/business/send', label: 'Send cards' },
  { href: '/business/pricing', label: 'Pricing' },
];

export function BusinessNav() {
  const path = usePathname();
  return (
    <nav aria-label="Business" className="flex items-center gap-1">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="chip"
          aria-current={path === l.href ? 'page' : undefined}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
