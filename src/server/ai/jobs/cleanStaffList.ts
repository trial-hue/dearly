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

const POSTCODE_ANYWHERE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi;

/** Replace every postcode with a token (PC1, PC2, ...) so the model never sees one. */
export function maskPostcodes(text: string): { masked: string; postcodes: string[] } {
  const postcodes: string[] = [];
  const masked = text.replace(POSTCODE_ANYWHERE, (m) => {
    postcodes.push(m);
    return `PC${postcodes.length}`;
  });
  return { masked, postcodes };
}

function unmaskPostcode(value: string, postcodes: string[]): string {
  const m = /^PC(\d+)$/i.exec(value.trim());
  return m ? (postcodes[Number(m[1]) - 1] ?? '') : value;
}

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
      `${RULES_LINE} Dates are day before month; output ISO "YYYY-MM-DD" when the year is known, else "MM-DD". Postcodes have been replaced by tokens such as PC1; copy the token into "postcode" unchanged, or "" when the row has none. Flag a duplicate name, an impossible date, or a missing postcode token in "issue"; otherwise issue is null. Do not invent dates.`,
      `Allowed values: occasion in ${JSON.stringify(OCCASIONS)}.`,
      `Data: ${JSON.stringify(maskPostcodes(input.text.slice(0, 6000)).masked)}`,
      'Reply with only JSON in this shape: [{"name": string, "date": string|null, "occasion": string, "postcode": string, "issue": string|null}]. Example: [{"name":"Aisha Khan","date":"1991-03-14","occasion":"birthday","postcode":"PC1","issue":null}]',
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
    const { postcodes } = maskPostcodes(input.text.slice(0, 6000));
    return items.map((item, i) =>
      toStaffRow({ ...item, postcode: unmaskPostcode(item.postcode, postcodes) }, lines[i] ?? ''),
    );
  },
  fallback(input) {
    return cleanStaffList(input.text);
  },
  summary(output) {
    const flagged = output.filter((r) => r.issue).length;
    return `Cleaned the staff list: ${output.length - flagged} ready, ${flagged} flagged`;
  },
});
