import { TITLES, type DesignId, type OccasionType } from '@/domain';

import { birthday } from './designs/birthday';
import { celebrations } from './designs/celebrations';
import { family } from './designs/family';
import { work } from './designs/work';
import { PALETTES } from './primitives';
import { designIdFromSvg, sceneToSvgString, type SceneInput, type Shape } from './scene';
import { TAGS, type DesignDef, type Tag } from './types';

export { TAGS };
export type { DesignDef, Tag };
export { PALETTES };
export type { SceneInput, Shape };

/** Every card front Dearly sells. Order is the default browse order. */
export const CATALOGUE: readonly DesignDef[] = [...birthday, ...family, ...celebrations, ...work];

const byId = new Map(CATALOGUE.map((d) => [d.id, d]));

export function designById(id: string | null | undefined): DesignDef | undefined {
  return id ? byId.get(id) : undefined;
}

export function designsFor(occasion: OccasionType): DesignDef[] {
  return CATALOGUE.filter((d) => d.occasions.includes(occasion));
}

export function designsWithTag(tag: Tag): DesignDef[] {
  return CATALOGUE.filter((d) => d.tags.includes(tag));
}

export interface DesignFilter {
  occasion?: OccasionType | null;
  tags?: Tag[];
  q?: string;
}

export function filterDesigns(f: DesignFilter): DesignDef[] {
  const q = f.q?.trim().toLowerCase();
  return CATALOGUE.filter((d) => {
    if (f.occasion && !d.occasions.includes(f.occasion)) return false;
    if (f.tags?.length && !f.tags.every((t) => d.tags.includes(t))) return false;
    if (
      q &&
      !`${d.title} ${d.tags.join(' ')} ${d.occasions.map((o) => TITLES[o]).join(' ')}`
        .toLowerCase()
        .includes(q)
    )
      return false;
    return true;
  });
}

/** Which of the twelve legacy design ids each catalogue design stands in for, and the reverse. */
export const LEGACY_TO_CATALOGUE: Record<DesignId, string> = {
  balloons: 'bday-balloon-bunch',
  confetti: 'work-confetti-years',
  bignumber: 'bday-big-number',
  wreath: 'thanks-wreath',
  tulips: 'mum-tulips',
  crescent: 'eid-crescent',
  menorah: 'hanukkah-menorah',
  diya: 'diwali-diyas',
  tree: 'xmas-tree',
  hearts: 'anniv-two-hearts',
  sun: 'leaving-sunrise',
  stripes: 'bday-confetti-pop',
};

export function legacyDesignFor(design: DesignDef): DesignId {
  const entry = (Object.entries(LEGACY_TO_CATALOGUE) as [DesignId, string][]).find(
    ([, id]) => id === design.id,
  );
  if (entry) return entry[0];
  const occ = design.occasions[0] ?? 'birthday';
  const fallback: Record<OccasionType, DesignId> = {
    birthday: 'balloons',
    anniversary: 'hearts',
    mothers_day: 'tulips',
    womens_day: 'tulips',
    eid: 'crescent',
    hanukkah: 'menorah',
    diwali: 'diya',
    christmas: 'tree',
    thank_you: 'wreath',
    work_anniversary: 'confetti',
    leaving: 'sun',
  };
  return fallback[occ];
}

export function titleFor(occasion: OccasionType): string {
  return TITLES[occasion];
}

/** The stored form of a chosen design: an SVG string with the design id embedded. */
export function renderDesignSvg(design: DesignDef, input: SceneInput): string {
  return sceneToSvgString(
    design.scene(input),
    `${input.title} card${input.name ? ` for ${input.name}` : ''}`,
    { designId: design.id },
  );
}

/**
 * Resolve what to draw for a card specification: a stored custom front (photo or SVG), the
 * catalogue design a stored SVG came from, or the catalogue stand-in for a legacy design id.
 */
export function resolveCardFace(card: {
  design: string;
  customFront?:
    { kind: 'media'; url: string; mediaId: string } | { kind: 'svg'; svg: string } | null;
}):
  | { kind: 'media'; url: string }
  | { kind: 'svg'; svg: string; design: DesignDef | undefined }
  | { kind: 'design'; design: DesignDef } {
  if (card.customFront?.kind === 'media') return { kind: 'media', url: card.customFront.url };
  if (card.customFront?.kind === 'svg')
    return {
      kind: 'svg',
      svg: card.customFront.svg,
      design: designById(designIdFromSvg(card.customFront.svg)),
    };
  const design = designById(LEGACY_TO_CATALOGUE[card.design as DesignId]) ?? CATALOGUE[0];
  return { kind: 'design', design: design as DesignDef };
}
