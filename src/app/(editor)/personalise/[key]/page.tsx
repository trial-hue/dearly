import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PersonaliseEditor } from '@/components/editor/PersonaliseEditor';
import { serialize } from '@/lib/serialize';
import { now } from '@/server/clock';
import { getProposal } from '@/server/services/proposals';

export const metadata: Metadata = { title: 'Personalise' };
export const dynamic = 'force-dynamic';

export default async function PersonalisePage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { key } = await params;
  const { from } = await searchParams;
  const view = await getProposal(decodeURIComponent(key), now());
  if (!view || view.status !== 'proposed') notFound();
  return (
    <PersonaliseEditor
      proposal={serialize(view)}
      from={from === 'reminder' ? 'reminder' : from === 'basket' ? 'basket' : 'shop'}
    />
  );
}
