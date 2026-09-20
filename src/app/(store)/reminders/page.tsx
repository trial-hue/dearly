import type { Metadata } from 'next';

import { ImportBox } from '@/components/people/ImportBox';
import { LifeEventBox } from '@/components/people/LifeEventBox';
import { PersonRow } from '@/components/people/PersonRow';
import { PageHeader } from '@/components/shell/PageHeader';
import { NewCardForm } from '@/components/today/NewCardForm';
import { ProposalEnvelope } from '@/components/today/ProposalEnvelope';
import { TodayActions } from '@/components/today/TodayActions';
import { Badge, Empty } from '@/components/ui';
import { RULES, TITLES } from '@/domain';
import { fmtDate, daysLabel, plural } from '@/lib/format';
import { serialize } from '@/lib/serialize';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { listPeople } from '@/server/services/people';
import { listProposals } from '@/server/services/proposals';

export const metadata: Metadata = { title: 'Today' };
export const dynamic = 'force-dynamic';

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string; tab?: string }>;
}) {
  const { new: newCard, tab } = await searchParams;
  const accountId = await getAccountId();
  const today = now();
  if (tab === 'people') {
    const people = await listPeople(accountId, today);
    return (
      <div className="container-x section">
        <PageHeader
          title="People and dates"
          lede="Everyone Dearly sends for you, their occasions and whether the address still checks out."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <ImportBox />
          <LifeEventBox />
        </div>
        <h2 className="section-title">Your people</h2>
        <ul className="grid gap-3 lg:grid-cols-2" data-testid="people-list">
          {people.map((p) => (
            <PersonRow key={p.id} person={serialize(p)} />
          ))}
        </ul>
      </div>
    );
  }
  const screen = await listProposals(accountId, today);

  return (
    <div className="container-x section">
      <PageHeader
        title="Today"
        lede={`Cards Dearly proposes for the next ${RULES.proposalWindowDays} days. Approve, edit or skip; the rest is done for you.`}
      >
        <TodayActions openCount={screen.today.length} />
      </PageHeader>

      {newCard ? <NewCardForm people={screen.people} /> : null}

      {screen.today.length === 0 ? (
        <Empty>
          Nothing to decide in the next {RULES.proposalWindowDays} days. New occasions appear here
          as they come into range.
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2" data-testid="ready-list">
          {screen.today.map((p) => (
            <ProposalEnvelope key={p.key} proposal={serialize(p)} />
          ))}
        </div>
      )}

      <h2 className="section-title">Later</h2>
      <p className="muted -mt-1 mb-3 text-sm">
        Between {RULES.proposalWindowDays + 1} and {RULES.laterWindowDays} days out. Each one moves
        to Today {RULES.proposalWindowDays} days before the occasion.
      </p>
      {screen.later.length === 0 && screen.beyond.length === 0 ? (
        <Empty>
          No occasions between {RULES.proposalWindowDays + 1} and {RULES.laterWindowDays} days out.
        </Empty>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {screen.later.map((p) => (
            <li
              key={p.key}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
            >
              <span className="font-medium">{p.person.name}</span>
              <span>{p.title.toLowerCase()}</span>
              <span className="muted">{fmtDate(p.dueDate)}</span>
              <span className="muted ml-auto">
                Dearly proposes this on{' '}
                {fmtDate(
                  new Date(new Date(p.dueDate).getTime() - RULES.proposalWindowDays * 86_400_000),
                )}
              </span>
              {p.flags.includes('community range') ? <Badge>community range</Badge> : null}
            </li>
          ))}
          {screen.beyond.map((b) => (
            <li
              key={`${b.personId}-${b.occasionType}`}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
            >
              <span className="font-medium">{b.name}</span>
              <span>{TITLES[b.occasionType].toLowerCase()}</span>
              <span className="muted">{fmtDate(b.date)}</span>
              <span className="muted ml-auto">Further ahead: {daysLabel(b.daysLeft)}</span>
            </li>
          ))}
        </ul>
      )}

      {screen.paused.length > 0 ? (
        <>
          <h2 className="section-title">Paused</h2>
          <ul className="space-y-1 text-sm">
            {screen.paused.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-2 rounded-md bg-surface2 px-3 py-2"
              >
                <span className="font-medium">{p.name}</span>
                <span className="muted">
                  No cards are proposed: {p.reason.toLowerCase()}
                  {p.since ? `, since ${fmtDate(p.since)}` : ''}. The life-event guard keeps this
                  off Today until you resume it on the People screen.
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {screen.approved.length > 0 ? (
        <>
          <h2 className="section-title">Approved recently</h2>
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface text-sm">
            {screen.approved.map((p) => (
              <li key={p.key} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <span className="font-medium">{p.person.name}</span>
                <span>{p.title.toLowerCase()}</span>
                <span className="muted">{fmtDate(p.dueDate)}</span>
                <a href="/orders" className="ml-auto underline">
                  See the order
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {screen.skippedCount > 0 ? (
        <p className="muted mt-3 text-xs">
          {plural(screen.skippedCount, 'card')} skipped this year.
        </p>
      ) : null}
    </div>
  );
}
