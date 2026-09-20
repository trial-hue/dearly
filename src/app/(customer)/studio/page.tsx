import type { Metadata } from 'next';

import { PageHeader } from '@/components/shell/PageHeader';
import { Studio } from '@/components/studio/Studio';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { listPeople } from '@/server/services/people';

export const metadata: Metadata = { title: 'eCard studio' };
export const dynamic = 'force-dynamic';

export default async function StudioPage() {
  const accountId = await getAccountId();
  const people = await listPeople(accountId, now());
  return (
    <>
      <PageHeader
        title="eCard studio"
        lede="Write it, draw on it, say it. Narration reveals your words as the recipient listens. Sent by link for 79p, today."
      />
      <Studio
        people={people
          .filter((p) => !p.pausedReason)
          .map((p) => ({ id: p.id, name: p.name, occasions: p.occasions.map((o) => o.type) }))}
      />
    </>
  );
}
