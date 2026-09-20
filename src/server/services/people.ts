import type { Occasion, Person } from '@prisma/client';

import {
  addressIsStale,
  daysBetween,
  isOccasionType,
  nextDate,
  startOfDay,
  yearsAt,
  type Actor,
  type ImportedPerson,
  type OccasionLike,
  type OccasionType,
} from '@/domain';
import { prisma } from '@/server/db';

import * as decisions from './decisionLog';

export function toOccasionLike(o: Occasion): OccasionLike {
  return {
    id: o.id,
    type: (isOccasionType(o.type) ? o.type : 'birthday') as OccasionType,
    monthDay: o.monthDay,
    startYear: o.startYear,
    adhocDate: o.adhocDate,
  };
}

export type PersonWithOccasionRows = Person & { occasions: Occasion[] };

export interface OccasionView {
  id: string;
  type: OccasionType;
  nextDate: Date | null;
  daysLeft: number | null;
  age: number | null;
  adhoc: boolean;
}

export interface PersonView {
  id: string;
  name: string;
  relationship: string;
  address: string | null;
  postcode: string | null;
  addrCheckedAt: Date | null;
  addressDaysAgo: number | null;
  stale: boolean;
  pausedReason: string | null;
  pausedAt: Date | null;
  note: string | null;
  occasions: OccasionView[];
}

export function toPersonView(p: PersonWithOccasionRows, today: Date): PersonView {
  return {
    id: p.id,
    name: p.name,
    relationship: p.relationship,
    address: p.address,
    postcode: p.postcode,
    addrCheckedAt: p.addrCheckedAt,
    addressDaysAgo: p.addrCheckedAt
      ? daysBetween(startOfDay(p.addrCheckedAt), startOfDay(today))
      : null,
    stale: addressIsStale(p, today),
    pausedReason: p.pausedReason,
    pausedAt: p.pausedAt,
    note: p.note,
    occasions: p.occasions.map((o) => {
      const like = toOccasionLike(o);
      const due = nextDate(like, today);
      return {
        id: o.id,
        type: like.type,
        nextDate: due,
        daysLeft: due ? daysBetween(startOfDay(today), due) : null,
        age: due ? yearsAt(o.startYear, due) : null,
        adhoc: Boolean(o.adhocDate),
      };
    }),
  };
}

export async function listPeople(accountId: string, today: Date): Promise<PersonView[]> {
  const people = await prisma.person.findMany({
    where: { accountId },
    include: { occasions: true },
    orderBy: { name: 'asc' },
  });
  return people.map((p) => toPersonView(p, today));
}

export async function getPerson(id: string) {
  return prisma.person.findUnique({ where: { id }, include: { occasions: true } });
}

/** Add people from an import (AI or rules). New people start with a confirmed, empty address. */
export async function addPeople(
  accountId: string,
  imported: ImportedPerson[],
  by: Actor,
  today: Date,
): Promise<number> {
  let count = 0;
  for (const p of imported) {
    if (!p.name.trim()) continue;
    const monthDay =
      p.month && p.day
        ? `${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
        : null;
    await prisma.person.create({
      data: {
        accountId,
        name: p.name.trim().slice(0, 80),
        relationship: p.relationship || 'friend',
        addrCheckedAt: today,
        occasions: { create: { type: p.occasion, monthDay, startYear: p.year ?? null } },
      },
    });
    count += 1;
  }
  if (count > 0) {
    await decisions.record({
      actor: by,
      job: 'import_people',
      summary: `Imported ${count} ${count === 1 ? 'person' : 'people'} with their occasions`,
    });
  }
  return count;
}

export async function pausePerson(id: string, reason: string, by: Actor, today: Date) {
  const person = await prisma.person.update({
    where: { id },
    data: { pausedReason: reason.slice(0, 120), pausedAt: today },
  });
  // Open proposals for a paused person are withdrawn.
  const withdrawn = await prisma.proposal.updateMany({
    where: { personId: id, status: 'proposed' },
    data: { status: 'withdrawn' },
  });
  await decisions.record({
    actor: by,
    job: 'life_event',
    summary: `Paused all cards for ${person.name}: ${reason}${withdrawn.count ? ` (${withdrawn.count} proposal withdrawn)` : ''}`,
  });
  return person;
}

export async function resumePerson(id: string) {
  const person = await prisma.person.update({
    where: { id },
    data: { pausedReason: null, pausedAt: null },
  });
  await prisma.proposal.updateMany({
    where: { personId: id, status: 'withdrawn' },
    data: { status: 'proposed' },
  });
  await decisions.record({
    actor: 'person',
    job: 'life_event',
    summary: `Resumed cards for ${person.name}`,
  });
  return person;
}

export async function confirmAddress(id: string, today: Date) {
  const person = await prisma.person.update({ where: { id }, data: { addrCheckedAt: today } });
  await decisions.record({
    actor: 'person',
    job: 'address',
    summary: `Confirmed the address for ${person.name}`,
  });
  return person;
}
