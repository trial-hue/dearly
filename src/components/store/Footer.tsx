import Link from 'next/link';

import type { TITLES } from '@/domain';
import { OCCASION_LABELS, OCCASION_SLUGS } from '@/lib/occasions';

import { DemoMenu } from './DemoMenu';
import { Logo } from './Logo';

const SHOP: (keyof typeof TITLES)[] = [
  'birthday',
  'anniversary',
  'mothers_day',
  'thank_you',
  'christmas',
  'eid',
  'diwali',
  'hanukkah',
];

export function Footer({ aiMode, aiLabel }: { aiMode: 'ai' | 'rules'; aiLabel: string }) {
  return (
    <footer className="mt-14 border-t-0 pb-24 md:pb-10">
      <div className="airmail-stripe h-1.5" aria-hidden="true" />
      <div className="container-x grid gap-8 pt-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-ink-2">
            Cards that arrive on time, for everyone who matters to you. Three finishes, three sizes,
            a saved copy for them, and a guarantee on every delivery.
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-bold">Shop</h2>
          <ul className="space-y-1 text-sm text-ink-2">
            {SHOP.map((t) => (
              <li key={t}>
                <Link
                  href={`/cards/${OCCASION_SLUGS[t]}`}
                  className="hover:text-ink hover:underline"
                >
                  {OCCASION_LABELS[t]} cards
                </Link>
              </li>
            ))}
            <li>
              <Link href="/cards" className="hover:text-ink hover:underline">
                All cards
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-bold">Your account</h2>
          <ul className="space-y-1 text-sm text-ink-2">
            <li>
              <Link href="/reminders" className="hover:text-ink hover:underline">
                Reminders
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-ink hover:underline">
                Orders
              </Link>
            </li>
            <li>
              <Link href="/my-cards" className="hover:text-ink hover:underline">
                My cards
              </Link>
            </li>
            <li>
              <Link href="/help" className="hover:text-ink hover:underline">
                Help
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-bold">Dearly for Business</h2>
          <p className="text-sm text-ink-2">
            Birthday, work anniversary and leaving cards for your whole team, on time, from £2.30 a
            card.
          </p>
          <Link
            href="/business"
            className="mt-2 inline-block text-sm font-semibold hover:underline"
          >
            Find out more
          </Link>
        </div>
      </div>
      <div className="container-x mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4 text-xs text-ink-2">
        <span>Dearly, Manchester. Delivery guarantee: arrives on time or your money back.</span>
        <DemoMenu aiMode={aiMode} aiLabel={aiLabel} />
      </div>
    </footer>
  );
}
