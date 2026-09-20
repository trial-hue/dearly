import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BrowseView, type BrowseParams } from '@/components/store/BrowseView';
import { OCCASION_LABELS, occasionFromSlug } from '@/lib/occasions';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ occasion: string }>;
}): Promise<Metadata> {
  const { occasion } = await params;
  const type = occasionFromSlug(occasion);
  return { title: type ? `${OCCASION_LABELS[type]} cards` : 'Cards' };
}

export default async function OccasionPage({
  params,
  searchParams,
}: {
  params: Promise<{ occasion: string }>;
  searchParams: Promise<BrowseParams>;
}) {
  const { occasion } = await params;
  const type = occasionFromSlug(occasion);
  if (!type) notFound();
  return <BrowseView occasion={type} params={await searchParams} />;
}
