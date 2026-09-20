import { Bell, CircleHelp, Images, Package } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/shell/PageHeader';

export const metadata: Metadata = { title: 'Account' };

const LINKS = [
  {
    href: '/orders',
    label: 'Orders',
    text: 'Where every card is, and what happens if one is late.',
    icon: Package,
  },
  {
    href: '/my-cards',
    label: 'My cards',
    text: 'Cards you have sent and received, kept for three years.',
    icon: Images,
  },
  {
    href: '/reminders?tab=people',
    label: 'People and dates',
    text: 'Who you send to, their occasions and addresses.',
    icon: Bell,
  },
  {
    href: '/help',
    label: 'Help',
    text: 'Ask about any card; we act straight away.',
    icon: CircleHelp,
  },
];

export default function AccountPage() {
  return (
    <div className="container-x section">
      <PageHeader title="Hello, Alex" lede="Everything about your cards in one place." />
      <ul className="grid gap-4 sm:grid-cols-2">
        {LINKS.map(({ href, label, text, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="panel flex items-start gap-4 hover:bg-line/50">
              <span className="rounded-full bg-surface p-3 text-primary">
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-bold">{label}</span>
                <span className="block text-sm text-ink-2">{text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
