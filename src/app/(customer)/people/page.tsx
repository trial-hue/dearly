import type { Metadata } from 'next';

import { ImportBox } from '@/components/people/ImportBox';
import { LifeEventBox } from '@/components/people/LifeEventBox';
import { PersonRow } from '@/components/people/PersonRow';
import { PageHeader } from '@/components/shell/PageHeader';
import { serialize } from '@/lib/serialize';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { listPeople } from '@/server/services/people';

export const metadata: Metadata = { title: 'People' };
export const dynamic = 'force-dynamic';

export default async function PeoplePage() {
  const accountId = await getAccountId();
  const people = await listPeople(accountId, now());
  return (
    <>
      <PageHeader
        title="People"
        lede="Everyone Dearly sends for you, their occasions and whether the address still checks out. Paste a list to import; tell Dearly when life changes."
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
    </>
  );
}
