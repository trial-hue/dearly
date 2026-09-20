import Link from 'next/link';

import { designsFor } from '@/catalogue';
import { CardMock } from '@/components/card/CardMock';
import { TITLES, type OccasionType } from '@/domain';
import { OCCASION_LABELS, OCCASION_SLUGS, OCCASION_TINTS } from '@/lib/occasions';

const TINT_BG: Record<string, string> = {
  blush: 'bg-blush',
  butter: 'bg-butter',
  mint: 'bg-mint',
  sky: 'bg-sky',
  lilac: 'bg-lilac',
};

/** A pastel tile with one card peeking out and the occasion name. */
export function OccasionTile({ occasion, count }: { occasion: OccasionType; count?: number }) {
  const design = designsFor(occasion)[0];
  return (
    <Link
      href={`/cards/${OCCASION_SLUGS[occasion]}`}
      className={`group flex items-center gap-3 overflow-hidden rounded-[12px] ${TINT_BG[OCCASION_TINTS[occasion]]} p-3 transition-transform duration-150 ease-out hover:-translate-y-0.5`}
      data-testid={`occasion-tile-${OCCASION_SLUGS[occasion]}`}
    >
      <div className="w-[64px] shrink-0 md:w-[76px]">
        {design ? <CardMock design={design} title={TITLES[occasion]} name="" bare /> : null}
      </div>
      <div className="min-w-0">
        <span className="block text-base font-bold leading-tight">{OCCASION_LABELS[occasion]}</span>
        {count != null ? <span className="text-xs text-ink-2">{count} designs</span> : null}
      </div>
    </Link>
  );
}
