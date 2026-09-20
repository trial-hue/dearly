'use client';

import { GuaranteeBadge } from '@/components/store/GuaranteeBadge';
import { MODES, SIZES, allowedModes, arrivalDate, type CardSpec, type PrintedMode } from '@/domain';
import { fmtDate, formatPence } from '@/lib/format';

export function DeliveryStep({
  card,
  dueDate,
  person,
  onMode,
  onConfirmAddress,
  busy,
}: {
  card: CardSpec;
  dueDate: string;
  person: { name: string; postcode: string | null; stale: boolean };
  onMode: (m: PrintedMode) => void;
  onConfirmAddress: () => void;
  busy: boolean;
}) {
  const ecard = card.mode === 'ecard';
  const modes = allowedModes(card.size);
  const first = person.name.split(' ')[0];
  return (
    <div className="space-y-4">
      {ecard ? (
        <p className="rounded-[12px] bg-surface-2 p-3 text-sm">
          Sent by link today, straight to {first}. Nothing to post.
        </p>
      ) : (
        <>
          <h3 className="text-sm font-bold">How it travels</h3>
          <div role="radiogroup" aria-label="Delivery" className="grid gap-2">
            {modes.map((m) => {
              const price = (MODES[m].price as Record<string, number>)[card.size] ?? 0;
              const arrives = arrivalDate(m, card.size, new Date(dueDate), new Date());
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={card.mode === m}
                  className="btn btn-choice flex-row items-center justify-between"
                  data-testid={`mode-${m}`}
                  disabled={busy || (card.size === 'giant' && m !== 'tracked')}
                  onClick={() => onMode(m)}
                >
                  <span className="flex flex-col">
                    <span className="font-bold">{MODES[m].label}</span>
                    <span className="text-xs text-ink-2">
                      {MODES[m].desc}. Arrives {fmtDate(arrives)}.
                    </span>
                  </span>
                  <span className="t-price text-sm">
                    {price ? formatPence(Math.round(price * 100)) : 'Free'}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-ink-2">
            {card.modeOverridden
              ? 'You chose this.'
              : 'Picked for the date, so it arrives in good time.'}{' '}
            {SIZES[card.size].label} {card.size === 'giant' ? 'cards travel tracked.' : ''}
          </p>
          <div className="rounded-[12px] bg-surface-2 p-3 text-sm">
            <p className="font-bold">
              To {person.name}, {person.postcode ?? 'no postcode yet'}
            </p>
            {person.stale ? (
              <p className="mt-1 text-ink-2">
                We last checked this address over a year ago.{' '}
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={onConfirmAddress}
                  disabled={busy}
                >
                  It&rsquo;s still right
                </button>
              </p>
            ) : (
              <p className="mt-1 text-ink-2">Checked within the year.</p>
            )}
          </div>
          <GuaranteeBadge />
        </>
      )}
    </div>
  );
}
