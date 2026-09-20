import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { designById, designsFor } from '@/catalogue';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductOptions } from '@/components/product/ProductOptions';
import { Carousel } from '@/components/store/Carousel';
import { ProductTile } from '@/components/store/ProductTile';
import { formatPence } from '@/lib/format';
import { OCCASION_LABELS, OCCASION_SLUGS } from '@/lib/occasions';
import { fromPricePence } from '@/lib/pricing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ designId: string }>;
}): Promise<Metadata> {
  const { designId } = await params;
  const design = designById(designId);
  return { title: design ? design.title : 'Card' };
}

export default async function ProductPage({ params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params;
  const design = designById(designId);
  if (!design) notFound();
  const occasion = design.occasions[0] ?? 'birthday';
  const related = designsFor(occasion)
    .filter((d) => d.id !== design.id)
    .slice(0, 10);
  return (
    <>
      <div className="container-x pt-4 md:pt-6">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-2">
          <Link href="/cards" className="hover:underline">
            Cards
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/cards/${OCCASION_SLUGS[occasion]}`} className="hover:underline">
            {OCCASION_LABELS[occasion]}
          </Link>
        </nav>
        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <ProductGallery designId={design.id} />
          <div>
            <h1 className="t-h1">{design.title}</h1>
            <p className="mt-1 text-lg">
              from <span className="t-price">{formatPence(fromPricePence())}</span>
              <span className="ml-2 text-sm text-ink-2">
                {design.tags
                  .filter((t) => t !== 'photo upload')
                  .slice(0, 3)
                  .join(' · ')}
              </span>
            </p>
            <div className="mt-5">
              <ProductOptions designId={design.id} />
            </div>
          </div>
        </div>
      </div>
      {related.length ? (
        <Carousel title="You might also like" seeAllHref={`/cards/${OCCASION_SLUGS[occasion]}`}>
          {related.map((d) => (
            <ProductTile key={d.id} design={d} />
          ))}
        </Carousel>
      ) : null}
      <div className="h-10" />
    </>
  );
}
