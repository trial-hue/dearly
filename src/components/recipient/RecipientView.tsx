'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ErrorNote } from '@/components/ui';
import { api, useAction } from '@/lib/fetcher';
import type { Serialized } from '@/lib/serialize';
import type { OrderView } from '@/server/services/orders';

import { CardReveal, type Animation } from './CardReveal';
import { RatingStars } from './RatingStars';

type OrderDTO = Serialized<OrderView>;
interface DigitalDTO {
  animation: string;
  narrationUrl: string | null;
  clipUrl: string | null;
  drawingUrl: string | null;
  wordTimings: unknown;
}

/** The recipient's page: the envelope opens, the card, the message, then rate, save, send one back. */
export function RecipientView({
  order: o,
  senderName,
  digital,
}: {
  order: OrderDTO;
  senderName: string;
  digital: DigitalDTO | null;
}) {
  const { run, busy, error } = useAction();
  const [stars, setStars] = useState(o.rating?.stars ?? 0);
  const [saved, setSaved] = useState(false);
  const [sentBack, setSentBack] = useState(false);
  const first = o.recipientName.split(' ')[0] ?? o.recipientName;
  const animation = ((digital?.animation as Animation) ?? 'envelope') as Animation;
  const timings = Array.isArray(digital?.wordTimings) ? (digital?.wordTimings as number[]) : [];
  return (
    <div className="mx-auto max-w-md" data-testid="recipient-view">
      <p className="mb-4 text-center text-sm text-ink-2">
        {first}, {senderName} sent you a card
      </p>
      <CardReveal
        card={o.card}
        title={o.title}
        name={first}
        message={o.card.message}
        animation={animation}
        narrationUrl={digital?.narrationUrl ?? null}
        timings={timings}
        drawingUrl={digital?.drawingUrl}
        clipUrl={digital?.clipUrl}
        width="w-[260px]"
      />

      <div className="mt-8 text-center">
        <p className="font-semibold">Did it make you smile?</p>
        <div className="mt-2">
          <RatingStars
            value={stars}
            disabled={busy !== null}
            onRate={(n) =>
              void run(
                'rate',
                async () => {
                  await api(`/api/r/${o.slug}/rate`, { json: { stars: n } });
                  setStars(n);
                },
                { refresh: false },
              )
            }
          />
        </div>
        {stars ? <p className="mt-1 text-xs text-ink-2">Thank you.</p> : null}
      </div>

      <div className="mt-8 grid gap-2">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={busy !== null || saved}
          data-testid="save-to-dearly"
          onClick={() =>
            void run(
              'save',
              async () => {
                await api(`/api/r/${o.slug}/save`, { json: {} });
                setSaved(true);
              },
              { refresh: false },
            )
          }
        >
          {saved ? 'Saved to your Dearly' : 'Save to my Dearly'}
        </button>
        <button
          type="button"
          className="btn btn-lg"
          disabled={busy !== null || sentBack}
          data-testid="send-one-back"
          onClick={() =>
            void run(
              'back',
              async () => {
                await api(`/api/r/${o.slug}/send-back`, { json: {} });
                setSentBack(true);
              },
              { refresh: false },
            )
          }
        >
          {sentBack ? 'A card back is waiting in Reminders' : 'Send one back'}
        </button>
        <a
          href={`/r/${o.slug}/card.svg`}
          className="btn btn-ghost"
          download
          data-testid="download-card"
        >
          Download the card
        </a>
        <ErrorNote message={error} />
      </div>
      <p className="mt-8 text-center text-xs text-ink-2">
        Made with{' '}
        <Link href="/" className="font-semibold hover:underline">
          Dearly
        </Link>
      </p>
    </div>
  );
}
