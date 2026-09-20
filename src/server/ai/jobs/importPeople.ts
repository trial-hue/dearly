import { z } from 'zod';

import { TITLES, parseImportText, type ImportedPerson } from '@/domain';

import { PROMPT_HEAD, RULES_LINE, defineJob } from './types';

export interface ImportInput {
  text: string;
}

const Item = z.object({
  name: z.string().min(1).max(80),
  relationship: z.string().max(40),
  occasion: z.string(),
  month: z.number().int().nullable(),
  day: z.number().int().nullable(),
  year: z.number().int().nullable(),
});
const Output = z.array(Item);
export type ImportOutput = ImportedPerson[];

const OCCASIONS = Object.keys(TITLES);

export const importPeopleJob = defineJob<ImportInput, ImportOutput>({
  tier: 'quick',
  maxTokens: 2000,
  buildPrompt(input) {
    return [
      `${PROMPT_HEAD} Read a pasted list of people and their occasions, one person per line, and structure it.`,
      `${RULES_LINE} Dates are day before month. If no relationship is given use "friend"; if no occasion is given use "birthday". Leave unknown date parts null. Do not invent people.`,
      `Allowed values: relationship one of mother, father, partner, grandmother, grandfather, aunt, uncle, sister, brother, son, daughter, friend, colleague; occasion in ${JSON.stringify(OCCASIONS)}.`,
      `Data: ${JSON.stringify(input.text.slice(0, 4000))}`,
      'Reply with only JSON in this shape: [{"name": string, "relationship": string, "occasion": string, "month": number|null, "day": number|null, "year": number|null}]. Example: [{"name":"Jo Ellis","relationship":"sister","occasion":"birthday","month":3,"day":14,"year":1990}]',
    ].join('\n');
  },
  schema: Output as unknown as z.ZodType<ImportOutput>,
  validate(output) {
    const clean = output.filter((p) => {
      if (p.month != null && (p.month < 1 || p.month > 12)) return false;
      if (p.day != null && (p.day < 1 || p.day > 31)) return false;
      if (p.month != null && p.day != null) {
        const probe = new Date(p.year ?? 2024, p.month - 1, p.day);
        if (probe.getMonth() !== p.month - 1) return false;
      }
      return OCCASIONS.includes(p.occasion);
    });
    if (clean.length === 0) throw new Error('no valid people in the reply');
    return clean as ImportOutput;
  },
  fallback(input) {
    return parseImportText(input.text);
  },
  summary(output) {
    return `Read ${output.length} ${output.length === 1 ? 'person' : 'people'} from the pasted list`;
  },
});
