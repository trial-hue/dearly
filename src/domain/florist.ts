import { addDays, isoDate, monthIndex, startOfDay } from './calendar';
import { FLORIST } from './constants';
import { normaliseOccasion, normaliseRelationship } from './importPeople';
import { toPence } from './money';
import type { OccasionType } from './types';

export interface FloristReading {
  recipient: string;
  relationship: string;
  occasion: OccasionType;
  date: string | null; // ISO
  age: number | null;
  customer: string | null;
  basketPence: number | null;
}

const LONG_DATE = /(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/;

/** Rules-based reading of a florist order: recipient, relationship, occasion, date and age. */
export function parseFloristOrder(text: string): FloristReading {
  const message = /card message:\s*(.+)/i.exec(text)?.[1] ?? text;
  const recipientLine = /recipient:\s*(.+)/i.exec(text)?.[1] ?? '';
  const recipient = recipientLine.split(',')[0]?.trim() || 'Recipient';

  let relationship = '';
  for (const word of [
    'mum',
    'mother',
    'dad',
    'father',
    'nan',
    'grandma',
    'grandad',
    'wife',
    'husband',
    'sister',
    'brother',
    'auntie',
    'aunt',
    'uncle',
  ]) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(message)) {
      relationship = normaliseRelationship(word);
      break;
    }
  }
  const occasion = normaliseOccasion(message) ?? 'birthday';
  const ageMatch = /\b(\d{1,3})(?:st|nd|rd|th)\s+birthday/i.exec(message);
  const age = ageMatch ? Number(ageMatch[1]) : null;

  let date: string | null = null;
  const dateLine = /deliver(?:y)?\s*(?:on|date)?:?\s*(.+)/i.exec(text)?.[1] ?? '';
  const m = LONG_DATE.exec(dateLine);
  if (m) {
    const month = monthIndex(m[2] ?? '');
    if (month >= 0) date = isoDate(new Date(Number(m[3]), month, Number(m[1])));
  }

  const customerMatch = /love,?\s+([A-Z][a-z]+)/.exec(message);
  const basketMatch = /£\s?(\d+(?:\.\d{2})?)/.exec(text);

  return {
    recipient,
    relationship: relationship || 'friend',
    occasion,
    date,
    age,
    customer: customerMatch?.[1] ?? null,
    basketPence: basketMatch ? Math.round(Number(basketMatch[1]) * 100) : null,
  };
}

/** The seeded sample order, dated 19 days from today. */
export function sampleFloristOrder(today: Date): string {
  const d = addDays(startOfDay(today), 19);
  const long = d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return [
    'Bloom and Co, order 4471',
    `Bouquet: Autumn Glow, £${FLORIST.sampleBasket.toFixed(2)}`,
    `Deliver on: ${long}`,
    'Card message: Happy 70th birthday Mum! With all our love, Claire, Ravi and the kids xx',
    'Recipient: Mrs J Sharma, Leicester',
  ].join('\n');
}

export const FLORIST_REFERRAL_FEE_PENCE = toPence(FLORIST.referralFee);
export const FLORIST_COMMISSION_PCT = FLORIST.commissionPct;

export function expectedCommissionPence(basketPence: number): number {
  return Math.round((basketPence * FLORIST.commissionPct) / 100);
}
