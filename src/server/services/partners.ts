import {
  FLORIST_REFERRAL_FEE_PENCE,
  expectedCommissionPence,
  formatPence,
  parseIsoDate,
  type FloristReading,
} from '@/domain';
import { prisma } from '@/server/db';
import { newSlug } from '@/server/ids';
import { json } from '@/server/json';
import { FLORIST_PARTNER_ID } from '@/server/seed/seedDemo';

import * as decisions from './decisionLog';

export interface ReferralLedger {
  referralFeePence: number;
  expectedCommissionPence: number;
  basketPence: number;
  freeFirstCard: boolean;
  customer: string;
  recipient: string;
  occasion: string;
  nextDate: string | null;
  readBy: 'ai' | 'rule';
}

/**
 * A florist's customer becomes a Dearly customer: their own account, the recipient as a person,
 * the occasion as a reminder, a free first card, and a ledger entry for the referral fee and the
 * commission expected next year.
 */
export async function createReferral(reading: FloristReading, readBy: 'ai' | 'rule', today: Date) {
  const partner = await prisma.partner.findUniqueOrThrow({ where: { id: FLORIST_PARTNER_ID } });
  const customer = reading.customer ?? 'Florist customer';
  const account = await prisma.account.create({
    data: {
      name: customer,
      email: `${newSlug().toLowerCase()}@referral.dearly.invalid`,
      isDemo: false,
    },
  });
  const date = parseIsoDate(reading.date);
  const monthDay = date
    ? `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : null;
  const startYear = date && reading.age != null ? date.getFullYear() - reading.age : null;
  const person = await prisma.person.create({
    data: {
      accountId: account.id,
      name: reading.recipient,
      relationship: reading.relationship,
      addrCheckedAt: today,
      note: `Referred by ${partner.name}`,
      occasions: { create: { type: reading.occasion, monthDay, startYear } },
    },
  });
  const basket = reading.basketPence ?? 3500;
  const nextYear = date ? new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()) : null;
  const ledger: ReferralLedger = {
    referralFeePence: partner.feePence || FLORIST_REFERRAL_FEE_PENCE,
    expectedCommissionPence: expectedCommissionPence(basket),
    basketPence: basket,
    freeFirstCard: true,
    customer,
    recipient: reading.recipient,
    occasion: reading.occasion,
    nextDate: nextYear ? nextYear.toISOString().slice(0, 10) : null,
    readBy,
  };
  const referral = await prisma.referral.create({
    data: {
      partnerId: partner.id,
      accountId: account.id,
      personId: person.id,
      ledger: json(ledger),
    },
  });
  await decisions.recordMany([
    {
      actor: readBy,
      job: 'read_florist_order',
      summary: `Read ${partner.name} order: ${reading.recipient} (${reading.relationship}), ${reading.occasion}${reading.age ? `, turning ${reading.age}` : ''}${reading.date ? ` on ${reading.date}` : ''}`,
    },
    {
      actor: 'rule',
      job: 'referral',
      summary: `Reminder set for ${customer}: ${reading.recipient}'s ${reading.occasion}${ledger.nextDate ? ` on ${ledger.nextDate}` : ''}, first card free with three dates; ${formatPence(ledger.referralFeePence)} owed to ${partner.name}; ${formatPence(ledger.expectedCommissionPence)} commission expected next year`,
    },
  ]);
  return referral;
}

export async function listReferrals() {
  const rows = await prisma.referral.findMany({
    include: { partner: true, person: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((r) => ({
    id: r.id,
    partner: r.partner.name,
    personName: r.person?.name ?? null,
    createdAt: r.createdAt,
    ledger: r.ledger as unknown as ReferralLedger,
  }));
}
