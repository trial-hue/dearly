import { sceneToSvgString } from '@/components/card/designs';
import { TITLES, sanitiseSvg, type CardSpec, type OccasionType } from '@/domain';

/** A standalone SVG of a card front for download: the custom AI front when present, else the design. */
export function cardSvg(input: {
  card: Pick<CardSpec, 'design' | 'customFront'> | null;
  design: string;
  occasionType: string;
  name: string;
  age?: number | null;
}): string {
  const custom = input.card?.customFront;
  if (custom?.kind === 'svg') {
    const clean = sanitiseSvg(custom.svg);
    if (clean) return `<?xml version="1.0" encoding="UTF-8"?>\n${clean}`;
  }
  const title = TITLES[input.occasionType as OccasionType] ?? input.occasionType;
  return `<?xml version="1.0" encoding="UTF-8"?>\n${sceneToSvgString(input.card?.design ?? input.design, { title, name: input.name, age: input.age ?? null })}`;
}
