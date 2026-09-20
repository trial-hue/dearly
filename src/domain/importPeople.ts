import { parseFlexibleDate } from './calendar';
import { FAMILY_RELATIONSHIPS, TITLES } from './constants';
import type { OccasionType } from './types';

export interface ImportedPerson {
  name: string;
  relationship: string;
  occasion: OccasionType;
  month: number | null;
  day: number | null;
  year: number | null;
}

const RELATIONSHIP_ALIASES: Record<string, string> = {
  mum: 'mother',
  mam: 'mother',
  mom: 'mother',
  mother: 'mother',
  dad: 'father',
  father: 'father',
  nan: 'grandmother',
  nana: 'grandmother',
  gran: 'grandmother',
  grandma: 'grandmother',
  grandmother: 'grandmother',
  grandad: 'grandfather',
  grandpa: 'grandfather',
  grandfather: 'grandfather',
  wife: 'partner',
  husband: 'partner',
  partner: 'partner',
  girlfriend: 'partner',
  boyfriend: 'partner',
  sister: 'sister',
  brother: 'brother',
  aunt: 'aunt',
  auntie: 'aunt',
  uncle: 'uncle',
  son: 'son',
  daughter: 'daughter',
  friend: 'friend',
  friends: 'friend',
  mate: 'friend',
  colleague: 'colleague',
  coworker: 'colleague',
  boss: 'colleague',
  manager: 'colleague',
};

export function normaliseRelationship(text: string): string {
  const t = text.toLowerCase().trim();
  if (RELATIONSHIP_ALIASES[t]) return RELATIONSHIP_ALIASES[t];
  for (const [alias, value] of Object.entries(RELATIONSHIP_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(t)) return value;
  }
  return '';
}

export function isKnownRelationship(text: string): boolean {
  return (
    normaliseRelationship(text) !== '' || (FAMILY_RELATIONSHIPS as readonly string[]).includes(text)
  );
}

export function normaliseOccasion(text: string): OccasionType | null {
  const t = text
    .toLowerCase()
    .replace(/[^a-z' ]/g, ' ')
    .trim();
  if (!t) return null;
  if (t.includes('mother')) return 'mothers_day';
  if (t.includes('women')) return 'womens_day';
  if (t.includes('work') && t.includes('anniv')) return 'work_anniversary';
  if (t.includes('anniv')) return 'anniversary';
  if (t.includes('birth')) return 'birthday';
  if (t.includes('thank')) return 'thank_you';
  if (t.includes('leav') || t.includes('farewell')) return 'leaving';
  for (const key of Object.keys(TITLES) as OccasionType[]) {
    if (t.includes(key.replace('_', ' ')) || t.includes(key)) return key;
  }
  return null;
}

/**
 * One person per line: name, relationship, occasion, date. Relationship, occasion and date are
 * optional; anything not recognised becomes a friend with a birthday and no date.
 */
export function parseImportLine(line: string): ImportedPerson | null {
  const parts = line
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const name = parts[0];
  if (!name) return null;
  let relationship = '';
  let occasion: OccasionType | null = null;
  let date: ReturnType<typeof parseFlexibleDate> = null;
  for (const part of parts.slice(1)) {
    if (!date) {
      const d = parseFlexibleDate(part);
      if (d) {
        date = d;
        continue;
      }
    }
    if (!relationship) {
      const r = normaliseRelationship(part);
      if (r) {
        relationship = r;
        continue;
      }
    }
    if (!occasion) {
      const o = normaliseOccasion(part);
      if (o) {
        occasion = o;
        continue;
      }
    }
  }
  // A bare "Nan" or "Mum" as the name is also a relationship.
  if (!relationship) relationship = normaliseRelationship(name) || 'friend';
  return {
    name,
    relationship,
    occasion: occasion ?? 'birthday',
    month: date?.month ?? null,
    day: date?.day ?? null,
    year: date?.year ?? null,
  };
}

export function parseImportText(text: string): ImportedPerson[] {
  return text
    .split(/\r?\n/)
    .map((l) => parseImportLine(l))
    .filter((p): p is ImportedPerson => p !== null);
}
