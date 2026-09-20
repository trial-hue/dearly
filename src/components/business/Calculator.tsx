'use client';

import { useState } from 'react';

import { Field } from '@/components/ui';
import { BUSINESS, annualCalculator } from '@/domain';
import { formatPence } from '@/lib/format';

export function Calculator() {
  const [cards, setCards] = useState(400);
  const [posted, setPosted] = useState(70);
  const [automate, setAutomate] = useState(false);
  const r = annualCalculator({ cardsPerYear: cards, postedShare: posted / 100, automate });
  return (
    <div className="card grid gap-4 md:grid-cols-[280px_1fr]" data-testid="calculator">
      <div className="space-y-3">
        <Field label={`Cards a year: ${cards}`} htmlFor="calc-cards">
          <input
            id="calc-cards"
            type="range"
            min={25}
            max={5000}
            step={25}
            value={cards}
            onChange={(e) => setCards(Number(e.target.value))}
            className="w-full"
          />
        </Field>
        <Field
          label={`Posted to homes: ${posted}%`}
          htmlFor="calc-posted"
          hint="The rest are dropped at the office."
        >
          <input
            id="calc-posted"
            type="range"
            min={0}
            max={100}
            step={5}
            value={posted}
            onChange={(e) => setPosted(Number(e.target.value))}
            className="w-full"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={automate}
            onChange={(e) => setAutomate(e.target.checked)}
          />{' '}
          Automate plan
        </label>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="muted">Dearly, a year</dt>
        <dd className="text-lg font-bold tabular-nums">{formatPence(r.dearlyPence)}</dd>
        <dt className="muted">Moonpig at {formatPence(BUSINESS.moonpigPerCard * 100)} a card</dt>
        <dd className="text-lg font-bold tabular-nums">{formatPence(r.moonpigPence)}</dd>
        <dt className="muted">Saving</dt>
        <dd
          className={`text-lg font-bold tabular-nums ${r.savingPence >= 0 ? 'text-green' : 'text-red'}`}
        >
          {formatPence(r.savingPence)}
        </dd>
        <dt className="muted">Posted price</dt>
        <dd className="tabular-nums">
          {formatPence(r.unitPostedPence)} a card ({r.posted} cards)
          {r.includedCards ? `, ${r.includedCards} included` : ''}
        </dd>
        <dt className="muted">Office drop</dt>
        <dd className="tabular-nums">
          {formatPence(BUSINESS.officeDrop * 100)} a card ({r.office} cards)
        </dd>
        {automate ? (
          <>
            <dt className="muted">Subscription</dt>
            <dd className="tabular-nums">{formatPence(r.subscriptionPence)}</dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}
