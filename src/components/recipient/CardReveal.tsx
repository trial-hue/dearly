'use client';

import { useEffect, useState } from 'react';

import { CardMock } from '@/components/card/CardMock';
import type { CardSpec } from '@/domain';

import { Narration } from './Narration';

export type Animation = 'envelope' | 'flip' | 'confetti';

export interface RevealProps {
  card: Pick<CardSpec, 'design' | 'customFront' | 'font' | 'handwriting'>;
  title: string;
  name: string;
  age?: number | null;
  message: string;
  animation: Animation;
  narrationUrl: string | null;
  timings: number[];
  drawingUrl?: string | null;
  clipUrl?: string | null;
  /** Start the animation as soon as it mounts. */
  autoplay?: boolean;
  width?: string;
}

export function fontClassFor(font: CardSpec['font']): string {
  return font === 'hand'
    ? 'font-hand text-[22px]'
    : font === 'serif'
      ? 'font-serif text-lg'
      : font === 'mono'
        ? 'font-mono text-base'
        : 'text-lg';
}

/** The envelope opens, the card rises, the message is read: shared by the recipient page and the preview. */
export function CardReveal({
  card,
  title,
  name,
  age,
  message,
  animation,
  narrationUrl,
  timings,
  drawingUrl,
  clipUrl,
  autoplay = true,
  width = 'w-[220px]',
}: RevealProps) {
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    if (!autoplay) return;
    const t = setTimeout(() => setOpened(true), 150);
    return () => clearTimeout(t);
  }, [autoplay]);
  return (
    <div>
      <div className={`anim-stage relative mx-auto ${width} ${opened ? `anim-${animation}` : ''}`}>
        {animation === 'confetti' && opened
          ? Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="confetti-piece"
                style={{
                  left: `${(i * 37) % 100}%`,
                  background: ['#E0274C', '#2B55C6', '#F5A623', '#1B7A5A'][i % 4],
                  animationDelay: `${(i % 6) * 0.12}s`,
                }}
                aria-hidden="true"
              />
            ))
          : null}
        <div
          className={animation === 'flip' ? 'flipping' : animation === 'envelope' ? 'rising' : ''}
        >
          <CardMock card={card} title={title} name={name} age={age} bare hover={false} />
        </div>
        {animation === 'envelope' ? (
          <div
            className="flap absolute inset-x-0 top-0 h-1/2 rounded-t-md bg-surface-2 opacity-90"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className="paper mx-auto mt-4 max-w-[380px] p-4">
        {drawingUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- drawing from the app's own storage
          <img src={drawingUrl} alt="A drawing inside the card" className="mb-3 w-full rounded" />
        ) : null}
        <Narration
          text={message}
          audioUrl={narrationUrl}
          timings={timings}
          className={fontClassFor(card.font)}
        />
        {card.handwriting ? (
          // eslint-disable-next-line @next/next/no-img-element -- handwriting from the app's own storage
          <img
            src={card.handwriting.url}
            alt="Handwriting"
            className={`mt-2 ${card.handwriting.signatureOnly ? 'ml-auto w-1/2' : 'w-full'}`}
          />
        ) : null}
        {clipUrl ? <video src={clipUrl} controls className="mt-3 w-full rounded" /> : null}
      </div>
    </div>
  );
}
