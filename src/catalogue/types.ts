import type { OccasionType } from '@/domain';

import type { PaletteName } from './primitives';
import type { SceneInput, Shape } from './scene';

export const TAGS = [
  'funny',
  'cute',
  'floral',
  'minimal',
  'photo upload',
  'milestone',
  'for him',
  'for her',
  'for kids',
] as const;
export type Tag = (typeof TAGS)[number];
export type TintName = 'blush' | 'butter' | 'mint' | 'sky' | 'lilac';

export interface DesignDef {
  id: string;
  title: string;
  occasions: OccasionType[];
  tags: Tag[];
  supportsPhoto: boolean;
  isAiMade: false;
  tint: TintName;
  palette: PaletteName;
  /** The front of the card for a recipient (name may be empty on a product page). */
  scene: (input: SceneInput) => Shape[];
}

export function def(d: Omit<DesignDef, 'isAiMade'>): DesignDef {
  return { ...d, isAiMade: false };
}
