import type { Metadata } from 'next';

import { BrowseView, type BrowseParams } from '@/components/store/BrowseView';

export const metadata: Metadata = { title: 'All cards' };

export default async function CardsPage({ searchParams }: { searchParams: Promise<BrowseParams> }) {
  const params = await searchParams;
  return <BrowseView occasion={null} params={params} />;
}
