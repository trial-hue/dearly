import { z } from 'zod';

import {
  UK_POSTCODE,
  cleanStaffList,
  normalisePostcode,
  parseIsoDate,
  type StaffRow,
} from '@/domain';

import { PROMPT_HEAD, RULES_LINE, defineJob } from './types';

export interface CleanStaffInput {
  text: string;
}

const Item = z.object({
  name: z.string().min(1).max(80),
  date: z.string().nullable(),
  occasion: z.string(),
  postcode: z.string().max(12),
  issue: z.string().max(160).nullable(),
});
const Output = z.array(Item);
export type CleanStaffOutput = StaffRow[];

const OCCASIONS = ['birthday', 'work_anniversary', 'leaving'];

/** Convert the AI's shape into the domain's StaffRow so both paths render the same table. */
function toStaffRow(item: z.infer<typeof Item>, raw: string): StaffRow {
  const iso =
    item.date && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && parseIsoDate(item.date)
      ? item.date
      : null;
  const monthDay = iso
    ? iso.slice(5)
    : item.date && /^\d{2}-\d{2}$/.test(item.date)
      ? item.date
      : null;
  const postcodeOk = item.postcode ? UK_POSTCODE.test(item.postcode) : false;
  const issues = [
    item.issue,
    !monthDay ? 'invalid or missing date' : null,
    !item.postcode ? 'missing postcode' : postcodeOk ? null : 'invalid postcode',
  ].filter(Boolean) as string[];
  const merged = [...new Set(issues)].join('; ');
  return {
    raw,
    name: item.name,
    date: iso,
    monthDay,
    year: iso ? Number(iso.slice(0, 4)) : null,
    occasion: (OCCASIONS.includes(item.occasion)
      ? item.occasion
      : 'birthday') as StaffRow['occasion'],
    postcode: postcodeOk ? normalisePostcode(item.postcode) : '',
    issue: merged || null,
  };
}

export const cleanStaffListJob = defineJob<CleanStaffInput, CleanStaffOutput>({
  tier: 'quick',
  maxTokens: 3000,
  buildPrompt(input) {
    return [
      `${PROMPT_HEAD} Clean a pasted staff list for a business account: one row per line as "name, date, occasion, postcode".`,
      `${RULES_LINE} Dates are day before month; output ISO "YYYY-MM-DD" when the year is known, else "MM-DD". Flag a duplicate name, an impossible date, or a missing or malformed UK postcode in "issue"; otherwise issue is null. Do not invent postcodes or dates.`,
      `Allowed values: occasion in ${JSON.stringify(OCCASIONS)}.`,
      `Data: ${JSON.stringify(input.text.slice(0, 6000))}`,
      'Reply with only JSON in this shape: [{"name": string, "date": string|null, "occasion": string, "postcode": string, "issue": string|null}]. Example: [{"name":"Aisha Khan","date":"1991-03-14","occasion":"birthday","postcode":"M4 5JH","issue":null}]',
    ].join('\n');
  },
  schema: Output as unknown as z.ZodType<CleanStaffOutput>,
  validate(output, input) {
    const lines = input.text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const items = output as unknown as z.infer<typeof Item>[];
    if (items.length === 0) throw new Error('empty staff list');
    return items.map((item, i) => toStaffRow(item, lines[i] ?? ''));
  },
  fallback(input) {
    return cleanStaffList(input.text);
  },
  summary(output) {
    const flagged = output.filter((r) => r.issue).length;
    return `Cleaned the staff list: ${output.length - flagged} ready, ${flagged} flagged`;
  },
});
