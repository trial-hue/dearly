import { sanitiseSvg, type CardSpec } from '@/domain';

import { CardArt } from './CardArt';

export interface CardFrontProps {
  card: Pick<CardSpec, 'design' | 'customFront'>;
  title: string;
  name?: string | null;
  age?: number | null;
  className?: string;
}

/** The card front: a custom photo, drawing or AI-drawn SVG when present, else the stock design. */
export function CardFront({ card, title, name, age, className }: CardFrontProps) {
  const front = card.customFront;
  if (front?.kind === 'media') {
    return (
      <div className={`paper ${className ?? ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- uploaded media served from the app's own storage route */}
        <img
          src={front.url}
          alt={`${title} card front for ${name ?? ''}`}
          className="block aspect-[264/370] w-full object-cover"
        />
      </div>
    );
  }
  if (front?.kind === 'svg') {
    const clean = sanitiseSvg(front.svg);
    if (clean)
      return (
        <div className={`paper ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: clean }} />
      );
  }
  return (
    <div className={`paper ${className ?? ''}`}>
      <CardArt design={card.design} title={title} name={name} age={age} />
    </div>
  );
}
