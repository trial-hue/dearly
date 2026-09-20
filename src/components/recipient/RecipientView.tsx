'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { CardFront } from '@/components/card/CardFront';
import { Badge, ErrorNote } from '@/components/ui';
import { api, useAction } from '@/lib/fetcher';
import type { Serialized } from '@/lib/serialize';
import type { OrderView } from '@/server/services/orders';

import { Narration } from './Narration';

type OrderDTO = Serialized<OrderView>;
interface DigitalDTO {
  animation: string;
  narrationUrl: string | null;
  clipUrl: string | null;
  drawingUrl: string | null;
  wordTimings: unknown;
}

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
  const [opened, setOpened] = useState(false);
  const first = o.recipientName.split(' ')[0];
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => setOpened(true), 150);
    return () => clearTimeout(t);
  }, []);
  const anim = digital?.animation ?? 'envelope';
  const fontClass =
    o.card.font === 'hand'
      ? 'font-hand text-[22px]'
      : o.card.font === 'serif'
        ? 'font-serif text-lg'
        : o.card.font === 'mono'
          ? 'font-mono text-base'
          : 'text-lg';
  const timings = Array.isArray(digital?.wordTimings) ? (digital?.wordTimings as number[]) : [];

  return (
    <div className="phone" data-testid="recipient-view">
      <p className="muted mb-2 text-center text-xs">
        A card from {senderName}, delivered by Dearly
      </p>
      <div
        ref={stageRef}
        className={`anim-stage relative mx-auto w-[220px] ${opened ? `anim-${anim}` : ''}`}
      >
        {anim === 'confetti' && opened
          ? Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="confetti-piece"
                style={{
                  left: `${(i * 37) % 100}%`,
                  background: ['#C92F3A', '#2B55C6', '#D9A441', '#1B6B57'][i % 4],
                  animationDelay: `${(i % 6) * 0.12}s`,
                }}
                aria-hidden="true"
              />
            ))
          : null}
        <div className={anim === 'flip' ? 'flipping' : anim === 'envelope' ? 'rising' : ''}>
          <CardFront card={o.card} title={o.title} name={first} />
        </div>
        {anim === 'envelope' ? (
          <div
            className="flap absolute inset-x-0 top-0 h-1/2 rounded-t-md bg-surface2 opacity-90"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className="paper mt-4 p-4">
        {digital?.drawingUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- drawing from the app's own storage
          <img
            src={digital.drawingUrl}
            alt="A drawing inside the card"
            className="mb-3 w-full rounded"
          />
        ) : null}
        <Narration
          text={o.card.message}
          audioUrl={digital?.narrationUrl ?? null}
          timings={timings}
          className={fontClass}
        />
        {o.card.handwriting ? (
          // eslint-disable-next-line @next/next/no-img-element -- handwriting from the app's own storage
          <img
            src={o.card.handwriting.url}
            alt="Handwriting"
            className={`mt-2 ${o.card.handwriting.signatureOnly ? 'ml-auto w-1/2' : 'w-full'}`}
          />
        ) : null}
        {digital?.clipUrl ? (
          <video src={digital.clipUrl} controls className="mt-3 w-full rounded" />
        ) : null}
      </div>

      <div className="mt-5 text-center">
        <p className="text-sm font-medium">How was the card?</p>
        <div role="radiogroup" aria-label="Rating" className="mt-1 flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={stars === n}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              data-testid={`star-${n}`}
              className={`text-2xl leading-none ${n <= stars ? 'text-amber' : 'text-line'}`}
              disabled={busy !== null}
              onClick={() =>
                run(
                  'rate',
                  async () => {
                    await api(`/api/r/${o.slug}/rate`, { json: { stars: n } });
                    setStars(n);
                  },
                  { refresh: false },
                )
              }
            >
              ★
            </button>
          ))}
        </div>
        {stars ? (
          <p className="muted mt-1 text-xs">
            Thank you. Ratings feed the printer scorecards on Operations.
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy !== null || saved}
          data-testid="save-to-dearly"
          onClick={() =>
            run(
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
          className="btn"
          disabled={busy !== null || sentBack}
          data-testid="send-one-back"
          onClick={() =>
            run(
              'back',
              async () => {
                await api(`/api/r/${o.slug}/send-back`, { json: {} });
                setSentBack(true);
              },
              { refresh: false },
            )
          }
        >
          {sentBack ? 'A reply card is proposed on Today' : 'Send one back'}
        </button>
        <a href={`/r/${o.slug}/card.svg`} className="btn btn-ghost" download>
          Download the card
        </a>
        <ErrorNote message={error} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
        <Badge>Recipient loop: reached from the QR code on the card back</Badge>
        <Link href="/today" className="underline">
          Back to the pilot
        </Link>
      </div>
    </div>
  );
}
