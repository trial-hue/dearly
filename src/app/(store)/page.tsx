import type { Metadata } from 'next';
import Link from 'next/link';

import { designsFor, designsWithTag } from '@/catalogue';
import { ReminderCard } from '@/components/reminders/ReminderCard';
import { Carousel } from '@/components/store/Carousel';
import { Hero } from '@/components/store/Hero';
import { OccasionTile } from '@/components/store/OccasionTile';
import { ProductTile } from '@/components/store/ProductTile';
import { ReassuranceRow } from '@/components/store/ReassuranceRow';
import { quote } from '@/domain';
import { nextDate, type OccasionType } from '@/domain';
import { formatPence } from '@/lib/format';
import { OCCASION_LABELS, OCCASION_SLUGS } from '@/lib/occasions';
import { serialize } from '@/lib/serialize';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { listProposals } from '@/server/services/proposals';

export const metadata: Metadata = { title: 'Dearly' };
export const dynamic = 'force-dynamic';

const TILES: OccasionType[] = [
  'birthday',
  'anniversary',
  'mothers_day',
  'thank_you',
  'christmas',
  'eid',
  'diwali',
  'hanukkah',
];

function nextFeast(today: Date): OccasionType {
  const feasts: OccasionType[] = ['diwali', 'eid', 'hanukkah'];
  let best: { occ: OccasionType; at: number } | null = null;
  for (const occ of feasts) {
    const d = nextDate({ type: occ, monthDay: null, adhocDate: null }, today);
    if (d && (!best || d.getTime() < best.at)) best = { occ, at: d.getTime() };
  }
  return best?.occ ?? 'diwali';
}

export default async function HomePage() {
  const accountId = await getAccountId();
  const today = now();
  const screen = await listProposals(accountId, today);
  const feast = nextFeast(today);
  return (
    <>
      <Hero
        headline="Cards that arrive on time, every time"
        text="Tell us who matters and when. We draft the card, print it beautifully and post it early, or send it by link today."
        cta="Add your dates"
        ctaHref="/reminders?tab=people"
      />
      {screen.today.length ? (
        <Carousel
          title="Ready for you"
          seeAllHref="/reminders"
          itemWidth="w-[300px]"
          testId="home-ready"
        >
          {screen.today.slice(0, 8).map((p) => (
            <ReminderCard key={p.key} proposal={serialize(p)} compact />
          ))}
        </Carousel>
      ) : null}
      <section className="container-x section !pb-0" aria-label="Occasions">
        <h2 className="t-h2 mb-4">Shop by occasion</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TILES.map((o) => (
            <li key={o}>
              <OccasionTile occasion={o} count={designsFor(o).length} />
            </li>
          ))}
        </ul>
      </section>
      <Carousel title="Birthday favourites" seeAllHref={`/cards/${OCCASION_SLUGS.birthday}`}>
        {designsFor('birthday')
          .slice(0, 10)
          .map((d) => (
            <ProductTile key={d.id} design={d} />
          ))}
      </Carousel>
      <Carousel title="Make it personal" seeAllHref="/cards?tag=photo+upload">
        {designsWithTag('photo upload').map((d) => (
          <ProductTile key={d.id} design={d} badge="Add a photo" />
        ))}
      </Carousel>
      <section className="container-x section !pb-0" aria-label="eCards">
        <div className="flex flex-wrap items-center gap-4 rounded-[16px] bg-lilac p-6 md:p-8">
          <div className="min-w-0 flex-1">
            <h2 className="t-h2">Need it today? Send an eCard</h2>
            <p className="mt-1 text-ink-2">
              Any design by link for{' '}
              {formatPence(
                quote({ size: 'regular', finish: 'signature', mode: 'ecard' }).totalPence,
              )}
              , with your voice reading the message, a clip and an opening animation.
            </p>
          </div>
          <Link href="/ecards" className="btn btn-primary btn-lg" data-testid="home-ecards">
            Choose an eCard
          </Link>
        </div>
      </section>
      <Carousel
        title={`Coming up: ${OCCASION_LABELS[feast]}`}
        seeAllHref={`/cards/${OCCASION_SLUGS[feast]}`}
      >
        {designsFor(feast).map((d) => (
          <ProductTile key={d.id} design={d} />
        ))}
      </Carousel>
      <ReassuranceRow />
    </>
  );
}
