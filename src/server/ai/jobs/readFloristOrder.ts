import { z } from 'zod';

import { TITLES, parseFloristOrder, parseIsoDate, type FloristReading } from '@/domain';

import { PROMPT_HEAD, RULES_LINE, defineJob } from './types';

export interface FloristInput {
  text: string;
}

const Output = z.object({
  recipient: z.string().min(1).max(80),
  relationship: z.string().max(40),
  occasion: z.string(),
  date: z.string().nullable(),
  age: z.number().int().nullable(),
});

const OCCASIONS = Object.keys(TITLES);

export const readFloristOrderJob = defineJob<FloristInput, FloristReading>({
  tier: 'quick',
  maxTokens: 300,
  buildPrompt(input) {
    return [
      `${PROMPT_HEAD} Read a florist's order and extract who the flowers are for, so we can set a card reminder for next year.`,
      `${RULES_LINE} The relationship is from the buyer's point of view (Mum means mother). The date is the delivery date as ISO "YYYY-MM-DD" or null. Age is the age being celebrated or null.`,
      `Allowed values: relationship one of mother, father, partner, grandmother, grandfather, aunt, uncle, sister, brother, son, daughter, friend, colleague; occasion in ${JSON.stringify(OCCASIONS)}.`,
      `Data: ${JSON.stringify(input.text.slice(0, 2000))}`,
      'Reply with only JSON in this shape: {"recipient": string, "relationship": string, "occasion": string, "date": string|null, "age": number|null}. Example: {"recipient":"Mrs J Sharma","relationship":"mother","occasion":"birthday","date":"2026-10-09","age":70}',
    ].join('\n');
  },
  schema: Output as unknown as z.ZodType<FloristReading>,
  validate(output, input) {
    const o = output as unknown as z.infer<typeof Output>;
    if (!OCCASIONS.includes(o.occasion)) throw new Error('unknown occasion');
    if (o.date && !parseIsoDate(o.date)) throw new Error('date does not parse');
    const rules = parseFloristOrder(input.text);
    return {
      ...rules,
      recipient: o.recipient,
      relationship: o.relationship,
      occasion: o.occasion as FloristReading['occasion'],
      date: o.date,
      age: o.age,
    };
  },
  fallback(input) {
    return parseFloristOrder(input.text);
  },
  summary(output) {
    return `Read a florist order for ${output.recipient} (${output.relationship}), ${output.occasion}`;
  },
});
