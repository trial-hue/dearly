import { daysBetween, nextDate, startOfDay, yearsAt } from './calendar';
import {
  COMMUNITY_OCCASIONS,
  DESIGN_FOR,
  MILESTONE_CLOSE_FAMILY,
  RULES,
  TITLES,
} from './constants';
import { chooseMode, offerEcardAlongside } from './delivery';
import { isMilestone, messageFor, relationshipGroup } from './templates';
import type {
  CardSpec,
  DesignId,
  OccasionLike,
  OccasionType,
  PersonLike,
  ProposalDraft,
} from './types';

export function proposalKey(personId: string, type: OccasionType, year: number): string {
  return `${personId}|${type}|${year}`;
}

export function isOccasionType(value: string): value is OccasionType {
  return Object.prototype.hasOwnProperty.call(TITLES, value);
}

export function addressIsStale(person: Pick<PersonLike, 'addrCheckedAt'>, today: Date): boolean {
  if (!person.addrCheckedAt) return true;
  const checked = new Date(person.addrCheckedAt);
  return daysBetween(startOfDay(checked), startOfDay(today)) > RULES.addressStaleDays;
}

export type ApprovalCheck = { ok: true } | { ok: false; reason: 'address_stale' };

/** Approval is blocked for printed cards when the address has not been confirmed within a year. */
export function canApprove(
  person: Pick<PersonLike, 'addrCheckedAt'>,
  today: Date,
  mode: string = 'advance',
): ApprovalCheck {
  if (mode === 'ecard') return { ok: true };
  return addressIsStale(person, today) ? { ok: false, reason: 'address_stale' } : { ok: true };
}

export interface DefaultProposalInput {
  person: PersonLike;
  occasion: OccasionLike;
  today: Date;
  sender: string;
}

/**
 * The rules-based proposal for a person and occasion. Also the guidance the AI is given.
 * Returns null when the occasion has no computable date.
 */
export function defaultProposal(input: DefaultProposalInput): ProposalDraft | null {
  const { person, occasion, today, sender } = input;
  const dueDate = nextDate(occasion, today);
  if (!dueDate) return null;
  const daysLeft = daysBetween(startOfDay(today), dueDate);
  const age =
    occasion.type === 'birthday' ||
    occasion.type === 'anniversary' ||
    occasion.type === 'work_anniversary'
      ? yearsAt(occasion.startYear, dueDate)
      : null;
  const milestone = occasion.type === 'birthday' && isMilestone(age);
  const group = relationshipGroup(person.relationship);
  const rel = person.relationship.toLowerCase();

  let design: DesignId = DESIGN_FOR[occasion.type];
  let size: CardSpec['size'] = 'regular';
  let finish: CardSpec['finish'] = 'signature';
  let gift: CardSpec['gift'] = 'none';
  const reasons: string[] = [];
  const flags: string[] = [];

  if (milestone) {
    design = 'bignumber';
    reasons.push(`${age}th birthday`);
    flags.push('milestone');
    if ((MILESTONE_CLOSE_FAMILY as readonly string[]).includes(rel)) {
      size = 'large';
      finish = 'luxe';
      gift = 'flowers';
      reasons.push('Large Luxe with flowers');
    }
  }
  if (group === 'colleague') {
    finish = 'classic';
    reasons.push('colleague: Regular Classic');
  }
  if (occasion.type === 'leaving') reasons.push('Giant group card offered');
  if (reasons.length === 0) reasons.push('Regular Signature by default');

  const mode = chooseMode(size, daysLeft, finish);
  if (daysLeft < 3) flags.push('urgent');
  if (occasion.type === 'eid') flags.push('subject to moon sighting');
  if ((COMMUNITY_OCCASIONS as readonly string[]).includes(occasion.type))
    flags.push('community range');
  if (addressIsStale(person, today)) flags.push('address needs confirming');

  const card: CardSpec = {
    design,
    size,
    finish,
    mode,
    modeOverridden: false,
    digital: false,
    gift,
    message: messageFor(occasion.type, {
      name: person.name,
      age,
      relationship: person.relationship,
      sender,
    }),
    font: 'hand',
    offerGiant: occasion.type === 'leaving',
    offerEcard: offerEcardAlongside(size, daysLeft, finish),
  };

  return {
    key: proposalKey(person.id, occasion.type, dueDate.getFullYear()),
    personId: person.id,
    occasionId: occasion.id,
    occasionType: occasion.type,
    dueDate,
    daysLeft,
    card,
    reason: reasons.join('; '),
    flags,
    age,
  };
}

export type PersonWithOccasions = PersonLike & { occasions: OccasionLike[] };

/**
 * Proposals that should exist: every unpaused person, every occasion falling inside the Later
 * window, minus keys that already exist. Paused people get nothing.
 */
export function proposalsDue(
  people: readonly PersonWithOccasions[],
  existingKeys: ReadonlySet<string>,
  today: Date,
  sender = 'Alex',
  windowDays: number = RULES.laterWindowDays,
): ProposalDraft[] {
  const out: ProposalDraft[] = [];
  for (const person of people) {
    if (person.pausedReason) continue;
    for (const occasion of person.occasions) {
      const draft = defaultProposal({ person, occasion, today, sender });
      if (!draft) continue;
      if (draft.daysLeft < 0 || draft.daysLeft > windowDays) continue;
      if (existingKeys.has(draft.key)) continue;
      out.push(draft);
    }
  }
  return out.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export type ProposalBucket = 'today' | 'later' | 'beyond' | 'past';

export function bucketFor(daysLeft: number): ProposalBucket {
  if (daysLeft < 0) return 'past';
  if (daysLeft <= RULES.proposalWindowDays) return 'today';
  if (daysLeft <= RULES.laterWindowDays) return 'later';
  return 'beyond';
}
