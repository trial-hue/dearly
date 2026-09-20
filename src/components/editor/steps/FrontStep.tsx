'use client';

import { useState } from 'react';

import { CATALOGUE, designsFor, resolveCardFace, type DesignDef } from '@/catalogue';
import { CardMock } from '@/components/card/CardMock';
import {
  DIGITAL,
  FINISHES,
  SIZES,
  type CardSpec,
  type Finish,
  type OccasionType,
  type Size,
} from '@/domain';
import { formatPence } from '@/lib/format';
import { cardPricePence } from '@/lib/pricing';

export function FrontStep({
  onOption,
  card,
  occasion,
  title,
  name,
  age,
  ecard,
  onDesign,
  onEcard,
  busy,
}: {
  card: CardSpec;
  occasion: OccasionType;
  title: string;
  name: string;
  age: number | null;
  ecard: boolean;
  onDesign: (d: DesignDef) => void;
  onOption: (patch: Partial<CardSpec>) => void;
  onEcard: (on: boolean) => void;
  busy: boolean;
}) {
  const [all, setAll] = useState(false);
  const face = resolveCardFace(card);
  const currentId = face.kind === 'media' ? null : (face.design?.id ?? null);
  const designs = all ? CATALOGUE : designsFor(occasion);
  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 rounded-[12px] bg-surface-2 p-3 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={ecard}
          disabled={busy}
          data-testid="ecard-toggle"
          onChange={(e) => onEcard(e.target.checked)}
        />
        <span>
          <span className="block font-bold">
            Send as eCard only, {formatPence(Math.round(DIGITAL.standalone * 100))}
          </span>
          <span className="text-ink-2">
            By link, today. No printed card, no delivery. Narration, a clip and an animation come
            with it.
          </span>
        </span>
      </label>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Choose a front</h3>
        <button type="button" className="chip" aria-pressed={all} onClick={() => setAll((a) => !a)}>
          {all ? 'This occasion only' : 'All designs'}
        </button>
      </div>
      <ul className="grid grid-cols-3 gap-2" aria-label="Designs">
        {designs.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              className={`w-full rounded-[10px] p-0.5 ring-offset-2 ring-offset-surface ${currentId === d.id ? 'ring-2 ring-ink' : 'hover:ring-2 hover:ring-line'}`}
              aria-pressed={currentId === d.id}
              aria-label={d.title}
              disabled={busy}
              data-testid={`design-${d.id}`}
              onClick={() => onDesign(d)}
            >
              <CardMock design={d} title={title} name={name} age={age} bare hover={false} />
            </button>
          </li>
        ))}
      </ul>
      {!ecard ? (
        <>
          <section>
            <h3 className="mb-2 text-sm font-bold">Size</h3>
            <div role="radiogroup" aria-label="Size" className="grid grid-cols-3 gap-2">
              {(Object.keys(SIZES) as Size[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={card.size === s}
                  className="btn btn-choice"
                  data-testid={`size-${s}`}
                  disabled={busy}
                  onClick={() => onOption({ size: s })}
                >
                  <span className="font-bold">{SIZES[s].label}</span>
                  <span className="text-xs text-ink-2">{SIZES[s].note}</span>
                  <span className="t-price mt-1 text-sm">
                    {formatPence(cardPricePence(s, card.finish))}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-bold">Finish</h3>
            <div role="radiogroup" aria-label="Finish" className="grid gap-2">
              {(Object.keys(FINISHES) as Finish[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={card.finish === f}
                  className="btn btn-choice flex-row items-center justify-between"
                  data-testid={`finish-${f}`}
                  disabled={busy}
                  onClick={() => onOption({ finish: f })}
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
                  <span className="t-price text-sm">
                    {formatPence(cardPricePence(card.size, f))}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
