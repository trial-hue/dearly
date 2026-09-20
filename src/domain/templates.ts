import { ordinal } from './calendar';
import { FAMILY_RELATIONSHIPS, SIGNOFF, TEMPLATES } from './constants';
import type { OccasionType } from './types';

export type RelationshipGroup = 'family' | 'friend' | 'colleague';

export function relationshipGroup(relationship: string): RelationshipGroup {
  const r = relationship.toLowerCase().trim();
  if ((FAMILY_RELATIONSHIPS as readonly string[]).includes(r)) return 'family';
  if (r.startsWith('friend')) return 'friend';
  return 'colleague';
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function isMilestone(age: number | null): boolean {
  if (age == null) return false;
  return age % 10 === 0 || age === 18 || age === 21;
}

export interface MessageContext {
  name: string;
  age: number | null;
  relationship: string;
  sender: string;
}

/** Number of template variants for an occasion (used to rotate on "Rewrite"). */
export function templateCount(type: OccasionType, age: number | null): number {
  const key = type === 'birthday' && isMilestone(age) ? 'milestone' : type;
  return (TEMPLATES[key] ?? TEMPLATES.birthday ?? []).length;
}

/** A complete fallback message: template variant plus a sign-off for the relationship group. */
export function messageFor(type: OccasionType, ctx: MessageContext, variant = 0): string {
  const key = type === 'birthday' && isMilestone(ctx.age) ? 'milestone' : type;
  const list = TEMPLATES[key] ?? TEMPLATES.birthday ?? [];
  const template = list[((variant % list.length) + list.length) % list.length] ?? '';
  // For a couple ("Priya and Tom") the name reads as given; otherwise the first name.
  const name = ctx.name.includes(' and ') ? ctx.name : firstName(ctx.name);
  const body = template
    .replace(/\{name\}/g, name)
    .replace(/\{age\}/g, ctx.age != null ? ordinal(ctx.age) : '');
  const signoff = SIGNOFF[relationshipGroup(ctx.relationship)].replace('{sender}', ctx.sender);
  return `${body} ${signoff}`;
}

export function sentenceCount(text: string): number {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean).length;
}

export const EMOJI = /\p{Extended_Pictographic}/u;
