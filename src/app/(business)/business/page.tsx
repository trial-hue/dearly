import type { Metadata } from 'next';
import Link from 'next/link';

import { designsFor } from '@/catalogue';
import { CardMock } from '@/components/card/CardMock';
import { BUSINESS } from '@/domain';
import { formatPence } from '@/lib/format';
import { getOrganisation } from '@/server/services/business';

export const metadata: Metadata = { title: 'Dearly for Business' };
export const dynamic = 'force-dynamic';

export default async function BusinessHome() {
  const org = await getOrganisation();
  const designs = [
    designsFor('birthday')[0],
    designsFor('work_anniversary')[0],
    designsFor('leaving')[0],
  ].filter((d): d is NonNullable<typeof d> => Boolean(d));
  return (
    <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
      <div>
        <h1 className="t-h1">Every birthday, anniversary and leaving card, on time</h1>
        <p className="mt-3 max-w-prose text-lg text-ink-2">
          Paste your staff list once. Dearly cleans it, schedules every card, and posts them to
          homes or drops them at the office, from {formatPence(BUSINESS.officeDrop * 100)} a card ex
          VAT. Moonpig charges {formatPence(BUSINESS.moonpigPerCard * 100)}.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/business/send" className="btn btn-primary btn-lg">
            Send cards for {org.name}
          </Link>
          <Link href="/business/pricing" className="btn btn-lg">
            See pricing
          </Link>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            [
              'Clean and schedule',
              'Messy dates, missing postcodes and duplicates are caught before anything is sent.',
            ],
            [
              'Home post or office drop',
              `${formatPence(BUSINESS.posted * 100)} posted, ${formatPence(BUSINESS.officeDrop * 100)} dropped, with volume tiers at 250 and 2,000 cards a year.`,
            ],
            [
              'Automate plan',
              `${formatPence(BUSINESS.automateMonthly * 100)} a month with ${BUSINESS.freeCards} cards included, and nothing to remember.`,
            ],
            ['Giant group cards', 'A3 cards for leavers, signed by the whole team, tracked.'],
          ].map(([t, d]) => (
            <li key={t} className="rounded-[12px] bg-surface p-4">
              <p className="font-bold">{t}</p>
              <p className="text-sm text-ink-2">{d}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-3 gap-3 self-start">
        {designs.map((d, i) => (
          <CardMock
            key={d.id}
            design={d}
            title={i === 0 ? 'Happy birthday' : i === 1 ? 'Happy work anniversary' : 'Good luck'}
            name=""
            hover={false}
          />
        ))}
      </div>
    </div>
  );
}
