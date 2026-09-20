'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/hq/operations', label: 'Operations' },
  { href: '/hq/partners', label: 'Partners' },
  { href: '/hq/kit', label: 'Component kit' },
];

export function HqNav() {
  const path = usePathname();
  return (
    <nav aria-label="HQ" className="flex items-center gap-1">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="chip"
          aria-current={path.startsWith(l.href) ? 'page' : undefined}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
