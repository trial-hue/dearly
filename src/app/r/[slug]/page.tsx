import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { RecipientView } from '@/components/recipient/RecipientView';
import { serialize } from '@/lib/serialize';
import { now } from '@/server/clock';
import { getOrderBySlug } from '@/server/services/orders';

export const metadata: Metadata = { title: 'A card for you', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function RecipientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await getOrderBySlug(slug, now());
  if (!found) notFound();
  return (
    <main className="min-h-full bg-surface-2 px-4 py-8 md:py-14">
      <RecipientView
        order={serialize(found.view)}
        senderName={found.senderName}
        digital={found.digitalCard ? serialize(found.digitalCard) : null}
      />
    </main>
  );
}
