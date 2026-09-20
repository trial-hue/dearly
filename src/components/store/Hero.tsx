import Link from 'next/link';

import { designById, designsFor } from '@/catalogue';
import { CardMock } from '@/components/card/CardMock';

/** Rounded hero: headline, one button, and three cards fanned to the right. */
export function Hero({
  headline,
  text,
  cta,
  ctaHref,
}: {
  headline: string;
  text: string;
  cta: string;
  ctaHref: string;
}) {
  const cards = [
    designById('bday-balloon-bunch'),
    designById('mum-tulips'),
    designById('anniv-two-hearts'),
  ].filter((d): d is NonNullable<typeof d> => Boolean(d));
  const fallback = designsFor('birthday').slice(0, 3);
  const trio = cards.length === 3 ? cards : fallback;
  return (
    <section className="container-x pt-6 md:pt-8">
      <div className="grid overflow-hidden rounded-[16px] bg-blush md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-center gap-4 p-6 md:p-12">
          <h1 className="t-display max-w-md">{headline}</h1>
          <p className="max-w-md text-lg text-ink-2">{text}</p>
          <div>
            <Link href={ctaHref} className="btn btn-primary btn-lg" data-testid="hero-cta">
              {cta}
            </Link>
          </div>
        </div>
        <div className="relative hidden min-h-[320px] md:block" aria-hidden="true">
          {trio.map((d, i) => (
            <div
              key={d.id}
              className="absolute w-[190px]"
              style={{
                left: `${10 + i * 26}%`,
                top: `${14 + (i % 2) * 10}%`,
                transform: `rotate(${-8 + i * 8}deg)`,
                zIndex: i,
              }}
            >
              <CardMock
                design={d}
                title={
                  d.occasions[0] === 'birthday'
                    ? 'Happy birthday'
                    : d.occasions[0] === 'mothers_day'
                      ? "Happy Mother's Day"
                      : 'Happy anniversary'
                }
                name=""
                bare
                hover={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
