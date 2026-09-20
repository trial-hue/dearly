'use client';

import { useState } from 'react';

import { designById } from '@/catalogue';
import { GuaranteeBadge } from '@/components/store/GuaranteeBadge';
import {
  FINISHES,
  MODES,
  SIZES,
  addDays,
  allowedModes,
  arrivalDate,
  quote,
  type Finish,
  type Size,
} from '@/domain';
import { fmtDate, formatPence } from '@/lib/format';
import { cardPricePence } from '@/lib/pricing';

import { RecipientDialog } from './RecipientDialog';

/** Size and finish tiles, the delivery promise, the total with delivery and the one primary button. */
export function ProductOptions({ designId }: { designId: string }) {
  const [size, setSize] = useState<Size>('regular');
  const [finish, setFinish] = useState<Finish>('signature');
  const [open, setOpen] = useState(false);
  const today = new Date();
  const design = designById(designId);
  const mode = allowedModes(size).includes('advance') ? 'advance' : 'tracked';
  const q = quote({ size, finish, mode });
  const tracked = arrivalDate('tracked', size, addDays(today, 2), today);
  const advance = arrivalDate('advance', size, addDays(today, 5), today);
  return (
    <div className="space-y-6" data-testid="product-options">
      <section>
        <h2 className="mb-2 text-sm font-bold">Size</h2>
        <div role="radiogroup" aria-label="Size" className="grid grid-cols-3 gap-2">
          {(Object.keys(SIZES) as Size[]).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={size === s}
              className="btn btn-choice"
              data-testid={`size-${s}`}
              onClick={() => setSize(s)}
            >
              <span className="font-bold">{SIZES[s].label}</span>
              <span className="text-xs text-ink-2">{SIZES[s].note}</span>
              <span className="t-price mt-1 text-sm">{formatPence(cardPricePence(s, finish))}</span>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-bold">Finish</h2>
        <div role="radiogroup" aria-label="Finish" className="grid gap-2">
          {(Object.keys(FINISHES) as Finish[]).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={finish === f}
              className="btn btn-choice flex-row items-center justify-between"
              data-testid={`finish-${f}`}
              onClick={() => setFinish(f)}
            >
              <span className="flex flex-col">
                <span className="font-bold">
                  {FINISHES[f].label}
                  {f === 'signature' ? (
                    <span className="label label-tint ml-2">Most popular</span>
                  ) : null}
                </span>
                <span className="text-xs text-ink-2">{FINISHES[f].note}</span>
              </span>
              <span className="t-price text-sm">{formatPence(cardPricePence(size, f))}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="panel text-sm" data-testid="delivery-promise">
        <p className="font-bold">Order today, arrives by {fmtDate(tracked)} with Tracked</p>
        {size !== 'giant' ? (
          <p className="text-ink-2">
            Or {fmtDate(advance)} by Advance post for{' '}
            {formatPence(quote({ size, finish, mode: 'advance' }).deliveryPence)}. Cards for a date
            further out are posted early and arrive two days before.
          </p>
        ) : (
          <p className="text-ink-2">Giant cards travel tracked, next day.</p>
        )}
        <p className="mt-2">
          <GuaranteeBadge />
        </p>
      </section>
      <section>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-2">Card with {MODES[mode].label.toLowerCase()}</span>
          <span className="t-price text-xl" data-testid="price-total">
            {formatPence(q.totalPence)}
          </span>
        </div>
        {q.moonpigPence != null ? (
          <p className="mt-1 text-xs text-ink-2" data-testid="moonpig-compare">
            The same Regular card at Moonpig: {formatPence(q.moonpigPence)} with first class.
          </p>
        ) : null}
        <button
          type="button"
          className="btn btn-primary btn-lg mt-3 w-full"
          data-testid="product-personalise"
          onClick={() => setOpen(true)}
        >
          Personalise
        </button>
      </section>
      <ul className="space-y-1 text-sm text-ink-2">
        <li>Printed on {FINISHES[finish].note.split(',')[0]} card, in the UK</li>
        <li>Your message inside, in your handwriting if you like</li>
        <li>A copy saved for them for three years</li>
        <li>Arrives on time or your money back</li>
      </ul>
      {design ? (
        <RecipientDialog
          open={open}
          onClose={() => setOpen(false)}
          design={design}
          size={size}
          finish={finish}
        />
      ) : null}
    </div>
  );
}
