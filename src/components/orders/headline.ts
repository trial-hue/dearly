import { ordinal, type OccasionType } from '@/domain';
import { OCCASION_LABELS } from '@/lib/occasions';

/** "Mum's birthday card", "A thank you for Priya and Tom". */
export function reminderHeadlineFromOrder(o: {
  recipientName: string;
  occasionType: OccasionType;
  card?: { design?: string };
}): string {
  const first = o.recipientName.includes(' and ')
    ? o.recipientName
    : (o.recipientName.split(' ')[0] ?? o.recipientName);
  const who = first.endsWith('s') ? `${first}'` : `${first}'s`;
  if (o.occasionType === 'thank_you') return `A thank you for ${first}`;
  if (o.occasionType === 'leaving') return `${who} leaving card`;
  return `${who} ${OCCASION_LABELS[o.occasionType].toLowerCase()} card`;
}

export function ageLabel(age: number | null): string {
  return age == null ? '' : `${ordinal(age)} `;
}
