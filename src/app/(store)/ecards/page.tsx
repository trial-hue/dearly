import type { Metadata } from 'next';

import { CATALOGUE } from '@/catalogue';
import { ProductTile } from '@/components/store/ProductTile';
import { quote } from '@/domain';
import { formatPence } from '@/lib/format';

export const metadata: Metadata = { title: 'eCards' };

/** Every design can go by link today. Tiles open the product page with the eCard path preset. */
export default function EcardsPage() {
  const price = formatPence(
    quote({ size: 'regular', finish: 'signature', mode: 'ecard' }).totalPence,
  );
  return (
    <div className="container-x pb-10 pt-6 md:pt-8">
      <div className="mb-6 grid gap-4 rounded-[16px] bg-lilac p-6 md:grid-cols-[1.4fr_1fr] md:p-10">
        <div>
          <h1 className="t-h1">eCards, sent by link today</h1>
          <p className="mt-2 max-w-prose text-lg text-ink-2">
            Any design, {price}. Add your voice reading the message, a short video, a drawing and an
            opening animation. They open it on their phone, keep it in their Dearly, and can send
            one back.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-2 self-center text-sm md:grid-cols-1">
          <li className="rounded-[12px] bg-surface p-3">
            Your words read aloud, lighting up as they play
          </li>
          <li className="rounded-[12px] bg-surface p-3">A video or voice note inside</li>
          <li className="rounded-[12px] bg-surface p-3">Envelope, flip or confetti opening</li>
          <li className="rounded-[12px] bg-surface p-3">Delivered the moment you send it</li>
        </ul>
      </div>
      <ul
        className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4"
        data-testid="ecard-grid"
      >
        {CATALOGUE.map((d) => (
          <li key={d.id}>
            <ProductTile design={d} badge="eCard" href={`/card/${d.id}?ecard=1`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
