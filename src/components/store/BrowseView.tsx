import { filterDesigns, type Tag } from '@/catalogue';
import type { OccasionType } from '@/domain';
import { ALL_OCCASIONS, OCCASION_LABELS, OCCASION_SLUGS } from '@/lib/occasions';

import { EmptyState } from './EmptyState';
import { FilterChips, STYLES, WHO_FOR, type ChipGroup } from './FilterChips';
import { ProductGrid } from './ProductGrid';
import { SortSelect } from './SortSelect';

export interface BrowseParams {
  tag?: string | string[];
  occasion?: string;
  sort?: string;
  q?: string;
}

const asList = (v: string | string[] | undefined): string[] =>
  Array.isArray(v) ? v : v ? [v] : [];

/** Title, result count, filter chips, sort and the grid. Shared by /cards and /cards/[occasion]. */
export function BrowseView({
  occasion,
  params,
}: {
  occasion: OccasionType | null;
  params: BrowseParams;
}) {
  const tags = asList(params.tag) as Tag[];
  const occFromParam = ALL_OCCASIONS.find((o) => OCCASION_SLUGS[o] === params.occasion) ?? null;
  const active = occasion ?? occFromParam;
  let designs = filterDesigns({ occasion: active, tags, q: params.q });
  if (params.sort === 'a-z') designs = [...designs].sort((a, b) => a.title.localeCompare(b.title));
  if (params.sort === 'newest') designs = [...designs].reverse();
  const groups: ChipGroup[] = [
    ...(occasion
      ? []
      : [
          {
            label: 'Occasion',
            param: 'occasion',
            multi: false,
            options: ALL_OCCASIONS.map((o) => ({
              value: OCCASION_SLUGS[o],
              label: OCCASION_LABELS[o],
            })),
          },
        ]),
    { label: 'Who for', param: 'tag', options: WHO_FOR },
    { label: 'Style', param: 'tag', options: STYLES },
  ];
  const title = occasion
    ? `${OCCASION_LABELS[occasion]} cards`
    : params.q
      ? `Cards matching “${params.q}”`
      : 'All cards';
  return (
    <div className="container-x pb-10 pt-6 md:pt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="t-h1">{title}</h1>
          <p className="text-sm text-ink-2">
            Three sizes, three finishes, your words inside. From £2.99 plus delivery.
          </p>
        </div>
        <SortSelect />
      </div>
      <FilterChips groups={groups} resultCount={designs.length} />
      <div className="mt-6">
        {designs.length ? (
          <ProductGrid designs={designs} />
        ) : (
          <EmptyState
            title="No cards match those filters"
            text="Try fewer filters, or another occasion."
            cta="See all cards"
            ctaHref="/cards"
          />
        )}
      </div>
    </div>
  );
}
