'use client';

import { formatPence } from '@/lib/format';

export function StickyBuyBar({
  totalPence,
  note,
  primary,
  secondary,
}: {
  totalPence: number;
  note?: string | null;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur"
      data-testid="sticky-bar"
    >
      <div className="container-x flex items-center gap-3 py-2.5">
        <div className="min-w-0">
          <div className="text-xs text-ink-2">Total, delivery included</div>
          <div className="t-price text-xl" data-testid="price-total">
            {formatPence(totalPence)}
          </div>
          {note ? (
            <div className="truncate text-xs text-ink-2" data-testid="moonpig-compare">
              {note}
            </div>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {secondary}
          {primary}
        </div>
      </div>
    </div>
  );
}
