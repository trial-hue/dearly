'use client';

import { GuaranteeBadge } from '@/components/store/GuaranteeBadge';
import { Field } from '@/components/ui';
import {
  MODES,
  PICKUP_PROMISE,
  SIZES,
  allowedModes,
  arrivalDate,
  toPence,
  type CardSpec,
  type PrintedMode,
} from '@/domain';
import { fmtDate, formatPence } from '@/lib/format';

export function DeliveryStep({
  card,
  dueDate,
  person,
  onMode,
  onDate,
  onConfirmAddress,
  busy,
}: {
  onDate: (date: string) => void;
  card: CardSpec;
  dueDate: string;
  person: { name: string; postcode: string | null; stale: boolean };
  onMode: (m: PrintedMode) => void;
  onConfirmAddress: () => void;
  busy: boolean;
}) {
  const ecard = card.mode === 'ecard';
  const modes = allowedModes(card.size, card.finish);
  const first = person.name.split(' ')[0];
  const todayIso = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-4">
      <Field
        label="The date it is for"
        htmlFor="occasion-date"
        hint="Move it and the delivery and price follow."
      >
        <input
          id="occasion-date"
          type="date"
          className="input"
          value={dueDate.slice(0, 10)}
          min={todayIso}
          disabled={busy}
          data-testid="occasion-date"
          onChange={(e) => {
            if (e.target.value) onDate(e.target.value);
          }}
        />
      </Field>
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
                    <span className="text-xs text-ink-2" data-testid={`mode-${m}-promise`}>
                      {MODES[m].desc}.{' '}
                      {m === 'pickup' ? `${PICKUP_PROMISE}.` : `Arrives ${fmtDate(arrives)}.`}
                    </span>
                  </span>
                  <span className="t-price text-sm">{formatPence(toPence(price))}</span>
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
          {MODES[card.mode].guarantee ? (
            <GuaranteeBadge />
          ) : (
            <p className="text-xs text-ink-2" data-testid="no-guarantee">
              Pick-up has no delivery guarantee: it is ready for them to collect today.
            </p>
          )}
        </>
      )}
    </div>
  );
}
