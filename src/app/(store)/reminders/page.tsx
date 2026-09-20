import type { Metadata } from 'next';

import { ComingUp } from '@/components/reminders/ComingUp';
import { DraftAllButton } from '@/components/reminders/DraftAllButton';
import { ImportDialog } from '@/components/reminders/ImportDialog';
import { LifeEventDialog } from '@/components/reminders/LifeEventDialog';
import { NewCardDialog } from '@/components/reminders/NewCardDialog';
import { PersonRow } from '@/components/reminders/PersonRow';
import { ReminderCard } from '@/components/reminders/ReminderCard';
import { Tabs } from '@/components/reminders/Tabs';
import { EmptyState } from '@/components/store/EmptyState';
import { serialize } from '@/lib/serialize';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { listPeople } from '@/server/services/people';
import { listProposals } from '@/server/services/proposals';

export const metadata: Metadata = { title: 'Reminders' };
export const dynamic = 'force-dynamic';

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === 'coming' || rawTab === 'people' ? rawTab : 'ready';
  const accountId = await getAccountId();
  const today = now();
  const [screen, people] = await Promise.all([
    listProposals(accountId, today),
    listPeople(accountId, today),
  ]);
  return (
    <div className="container-x section">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="t-h1">Reminders</h1>
          <p className="text-sm text-ink-2">
            Cards we have ready, what is coming up, and the people they are for.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === 'ready' ? <DraftAllButton count={screen.today.length} /> : null}
          <NewCardDialog people={screen.people} />
        </div>
      </div>
      <Tabs
        base="/reminders"
        current={tab}
        tabs={[
          { id: 'ready', label: 'Ready for you', count: screen.today.length },
          { id: 'coming', label: 'Coming up', count: screen.later.length + screen.beyond.length },
          { id: 'people', label: 'People and dates', count: people.length },
        ]}
      />

      {tab === 'ready' ? (
        screen.today.length === 0 ? (
          <EmptyState
            title="Nothing to decide right now"
            text="Cards appear here 35 days before each occasion, drafted and priced."
            cta="Browse cards"
            ctaHref="/cards"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2" data-testid="ready-list">
            {screen.today.map((p) => (
              <ReminderCard key={p.key} proposal={serialize(p)} />
            ))}
          </div>
        )
      ) : null}

      {tab === 'coming' ? <ComingUp screen={screen} /> : null}

      {tab === 'people' ? (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <ImportDialog />
            <LifeEventDialog />
          </div>
          <ul className="grid gap-3 lg:grid-cols-2" data-testid="people-list">
            {people.map((p, i) => (
              <PersonRow key={p.id} person={serialize(p)} index={i} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
