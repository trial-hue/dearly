import Link from 'next/link';

import type { DesignDef } from '@/catalogue';
import { CardMock } from '@/components/card/CardMock';
import { TITLES } from '@/domain';
import { formatPence } from '@/lib/format';
import { fromPricePence } from '@/lib/pricing';

/** Image first: the card, an optional badge and the price from. Nothing else. */
export function ProductTile({
  design,
  badge,
  priority = false,
}: {
  design: DesignDef;
  badge?: string;
  priority?: boolean;
}) {
  const label =
    badge ??
    (design.supportsPhoto
      ? 'Add a photo'
      : design.tags.includes('milestone')
        ? 'Milestone'
        : undefined);
  return (
    <Link
      href={`/card/${design.id}`}
      className="tile group block overflow-hidden"
      data-testid={`product-tile-${design.id}`}
      aria-label={`${design.title}, from ${formatPence(fromPricePence())}`}
    >
      <div className="relative">
        <CardMock
          design={design}
          title={TITLES[design.occasions[0] ?? 'birthday']}
          name=""
          tint={design.tint}
          priority={priority}
          className="rounded-b-none"
        />
        {label ? <span className="label label-tint absolute left-3 top-3">{label}</span> : null}
      </div>
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="sr-only">{design.title}</span>
        <span className="t-price">from {formatPence(fromPricePence())}</span>
      </div>
    </Link>
  );
}
