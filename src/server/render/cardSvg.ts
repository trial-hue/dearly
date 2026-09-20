import { LEGACY_TO_CATALOGUE, designById, renderDesignSvg } from '@/catalogue';
import { TITLES, sanitiseSvg, type CardSpec, type DesignId, type OccasionType } from '@/domain';

/** A standalone SVG of a card front for download: the stored front when present, else the catalogue stand-in. */
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
  const legacy = (input.card?.design ?? input.design) as DesignId;
  const design = designById(LEGACY_TO_CATALOGUE[legacy]) ?? designById('bday-balloon-bunch');
  if (!design) throw new Error('catalogue is empty');
  return `<?xml version="1.0" encoding="UTF-8"?>\n${renderDesignSvg(design, { title, name: input.name, age: input.age ?? null })}`;
}
