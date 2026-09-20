import type { Metadata } from 'next';

import { CATALOGUE, designsFor } from '@/catalogue';
import { CardMock } from '@/components/card/CardMock';
import { KitDemos } from '@/components/hq/KitDemos';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { PersonRow } from '@/components/reminders/PersonRow';
import { ReminderCard } from '@/components/reminders/ReminderCard';
import { Carousel } from '@/components/store/Carousel';
import { EmptyState } from '@/components/store/EmptyState';
import { GuaranteeBadge } from '@/components/store/GuaranteeBadge';
import { Hero } from '@/components/store/Hero';
import { OccasionTile } from '@/components/store/OccasionTile';
import { ProductTile } from '@/components/store/ProductTile';
import { PromoStrip } from '@/components/store/PromoStrip';
import { ReassuranceRow } from '@/components/store/ReassuranceRow';
import { ProductGridSkeleton } from '@/components/store/Skeleton';
import { Badge } from '@/components/ui';
import { formatPence } from '@/lib/format';
import { fromPricePence } from '@/lib/pricing';
import { serialize } from '@/lib/serialize';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { listPeople } from '@/server/services/people';
import { listProposals } from '@/server/services/proposals';

export const metadata: Metadata = { title: 'Component kit' };
export const dynamic = 'force-dynamic';

function Demo({
  name,
  children,
  note,
}: {
  name: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <section
      className="rounded-[12px] border border-line bg-surface p-4"
      id={name.toLowerCase().replace(/\s+/g, '-')}
    >
      <h2 className="t-h3">{name}</h2>
      {note ? <p className="mb-3 text-xs text-ink-2">{note}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}

export default async function KitPage() {
  const accountId = await getAccountId();
  const today = now();
  const [screen, people] = await Promise.all([
    listProposals(accountId, today),
    listPeople(accountId, today),
  ]);
  const reminder = screen.today[0];
  const person = people[0];
  const design = CATALOGUE[0]!;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="t-h1">Component kit</h1>
        <p className="text-ink-2">
          Every storefront component with sample data. Header, CategoryNav, SearchField,
          BottomTabBar and Footer are live on any storefront page; EditorShell, ToolPanel,
          BottomSheet, StepIndicator and StickyBuyBar are live on any Personalise page.
        </p>
      </div>
      <Demo name="PromoStrip">
        <PromoStrip />
      </Demo>
      <Demo name="Hero">
        <Hero
          headline="Cards that arrive on time"
          text="A hero with one button."
          cta="Add your dates"
          ctaHref="/reminders?tab=people"
        />
      </Demo>
      <Demo name="OccasionTile">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(['birthday', 'eid', 'thank_you', 'christmas'] as const).map((o) => (
            <OccasionTile key={o} occasion={o} count={designsFor(o).length} />
          ))}
        </div>
      </Demo>
      <Demo name="Carousel and ProductTile" note="Image, optional badge, price from. Nothing else.">
        <Carousel title="Sample carousel" seeAllHref="/cards">
          {designsFor('birthday')
            .slice(0, 6)
            .map((d) => (
              <ProductTile key={d.id} design={d} />
            ))}
        </Carousel>
      </Demo>
      <Demo
        name="CardMock"
        note="Portrait 5:7, paper edge, ground shadow, tilt on hover, on a tint."
      >
        <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
          {CATALOGUE.slice(0, 6).map((d) => (
            <CardMock key={d.id} design={d} title="Happy birthday" name="Sam" age={40} />
          ))}
        </div>
      </Demo>
      <Demo name="Badge, PriceFrom, GuaranteeBadge">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Plain</Badge>
          <Badge kind="ai">Drafted for you</Badge>
          <Badge kind="flag">Needs a check</Badge>
          <Badge kind="danger">Late</Badge>
          <span className="t-price">from {formatPence(fromPricePence())}</span>
          <GuaranteeBadge />
          <GuaranteeBadge compact />
        </div>
      </Demo>
      <KitDemos designId={design.id} />
      {reminder ? (
        <Demo name="ReminderCard">
          <div className="max-w-xl">
            <ReminderCard proposal={serialize(reminder)} />
          </div>
        </Demo>
      ) : null}
      {person ? (
        <Demo name="PersonRow">
          <ul className="max-w-xl">
            <PersonRow person={serialize(person)} />
          </ul>
        </Demo>
      ) : null}
      <Demo name="OrderTimeline">
        <OrderTimeline
          stages={['checked', 'routed', 'printed', 'inspected', 'posted', 'delivered']}
          current="inspected"
        />
      </Demo>
      <Demo name="EmptyState">
        <EmptyState
          title="Nothing here yet"
          text="An empty state with one call to action."
          cta="Browse cards"
          ctaHref="/cards"
        />
      </Demo>
      <Demo name="Skeleton">
        <ProductGridSkeleton count={4} />
      </Demo>
      <Demo name="ReassuranceRow">
        <ReassuranceRow />
      </Demo>
    </div>
  );
}
