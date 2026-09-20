import { resolveCardFace, type DesignDef } from '@/catalogue';
import { sanitiseSvg, type CardSpec } from '@/domain';

import { SceneSvg } from './SceneSvg';

type Tint = 'blush' | 'butter' | 'mint' | 'sky' | 'lilac' | 'none';

export interface CardMockProps {
  /** A catalogue design to draw, or a card specification (custom front, stored SVG or legacy id). */
  design?: DesignDef;
  card?: Pick<CardSpec, 'design' | 'customFront'>;
  title: string;
  name?: string | null;
  age?: number | null;
  tint?: Tint;
  /** Paper only, no tint backdrop or hover tilt; for thumbnails inside other components. */
  bare?: boolean;
  hover?: boolean;
  className?: string;
  priority?: boolean;
}

const TINT_CLASS: Record<Tint, string> = {
  blush: 'bg-blush',
  butter: 'bg-butter',
  mint: 'bg-mint',
  sky: 'bg-sky',
  lilac: 'bg-lilac',
  none: '',
};

/**
 * Every card in the interface renders through this: portrait 5:7, paper-white face, a subtle
 * paper edge, a soft ground shadow, a slight tilt on hover, on a pastel tint backdrop.
 */
export function CardMock({
  design,
  card,
  title,
  name,
  age,
  tint,
  bare = false,
  hover = true,
  className,
}: CardMockProps) {
  const face = design ? { kind: 'design' as const, design } : card ? resolveCardFace(card) : null;
  const label = `${title} card${name ? ` for ${name}` : ''}`;
  const resolvedTint: Tint =
    tint ?? (face && face.kind !== 'media' && face.design ? face.design.tint : 'butter');
  const paper = (
    <div
      className={`relative aspect-[5/7] w-full overflow-hidden rounded-[6px] bg-paper text-paper-ink shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_0_0_1px_rgba(20,33,61,0.08)] ${hover && !bare ? 'transition-transform duration-150 ease-out group-hover:-translate-y-1 group-hover:rotate-2' : ''}`}
    >
      {face?.kind === 'media' ? (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded media served from the app's own storage route
        <img src={face.url} alt={label} className="block h-full w-full object-cover" />
      ) : face?.kind === 'svg' ? (
        <div
          className="h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
          role="img"
          aria-label={label}
          dangerouslySetInnerHTML={{ __html: sanitiseSvg(face.svg) ?? '' }}
        />
      ) : face?.kind === 'design' ? (
        <SceneSvg
          shapes={face.design.scene({ title, name: name ?? '', age: age ?? null })}
          label={label}
          className="block h-full w-full"
        />
      ) : null}
    </div>
  );
  if (bare) return <div className={className}>{paper}</div>;
  return (
    <div
      className={`group relative rounded-[12px] ${TINT_CLASS[resolvedTint]} p-[9%] ${className ?? ''}`}
    >
      <div
        className="absolute inset-x-[18%] bottom-[5%] h-[6%] rounded-[50%] bg-ink/15 blur-md"
        aria-hidden="true"
      />
      {paper}
    </div>
  );
}
