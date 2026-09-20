import { z } from 'zod';

import { DESIGNS, EMOJI, FINISHES, GIFTS, SIZES, firstName, sentenceCount } from '@/domain';

import { PROMPT_HEAD, RULES_LINE, defineJob } from './types';

export interface OpenProposal {
  key: string;
  firstName: string;
  relationship: string;
  occasion: string;
  date: string;
  daysLeft: number;
  age: number | null;
  milestone: boolean;
  current: { design: string; size: string; finish: string; gift: string; message: string };
  pastMessages: string[];
}

export interface ProposalsInput {
  sender: string;
  proposals: OpenProposal[];
}

const Item = z.object({
  key: z.string(),
  message: z.string().min(1).max(400),
  design: z.string(),
  size: z.string(),
  finish: z.string(),
  gift: z.string(),
  reason: z.string().max(120),
});

const Output = z.array(Item);
export type ProposalsOutput = z.infer<typeof Output>;

const SIZE_KEYS = Object.keys(SIZES);
const FINISH_KEYS = Object.keys(FINISHES);
const GIFT_IDS = GIFTS.map((g) => g.id) as string[];

export const proposalsJob = defineJob<ProposalsInput, ProposalsOutput>({
  tier: 'default',
  maxTokens: 4000,
  buildPrompt(input) {
    const data = input.proposals.map((p) => ({
      key: p.key,
      firstName: firstName(p.firstName).includes(' and ') ? p.firstName : firstName(p.firstName),
      relationship: p.relationship,
      occasion: p.occasion,
      date: p.date,
      daysLeft: p.daysLeft,
      age: p.age,
      milestone: p.milestone,
      current: p.current,
      pastMessages: p.pastMessages,
    }));
    return [
      `${PROMPT_HEAD} Draft the greeting card message and choose the card options for each upcoming occasion below, for the sender "${input.sender}".`,
      `${RULES_LINE} Each message is 1 to 3 sentences, warm and specific to the relationship and occasion, ends with a sign-off using the sender's first name, and never repeats a past message. Mention the age only for milestone birthdays (multiples of 10, or 18 or 21).`,
      'Option guidance: default Regular size and Signature finish. A milestone birthday for a mother, father, partner or grandparent: Large, Luxe, with flowers. A colleague: Regular, Classic, no gift. Use the "bignumber" design for milestone birthdays; otherwise keep the current design unless another fits better. Keep the current gift unless the guidance says otherwise.',
      `Allowed values: design in ${JSON.stringify(DESIGNS)}; size in ${JSON.stringify(SIZE_KEYS)}; finish in ${JSON.stringify(FINISH_KEYS)}; gift in ${JSON.stringify(GIFT_IDS)}. Reason: under 12 words.`,
      `Data: ${JSON.stringify(data)}`,
      'Reply with only JSON in this shape: [{"key": string, "message": string, "design": string, "size": string, "finish": string, "gift": string, "reason": string}]. One object per key. Example: [{"key":"p1|birthday|2026","message":"Happy 60th birthday, Mum. Sixty looks wonderful on you. Love, Alex","design":"bignumber","size":"large","finish":"luxe","gift":"flowers","reason":"Milestone birthday for a parent"}]',
    ].join('\n');
  },
  schema: Output,
  validate(output, input) {
    const keys = new Set(input.proposals.map((p) => p.key));
    const seen = new Set<string>();
    const clean = output.filter((item) => {
      if (!keys.has(item.key) || seen.has(item.key)) return false;
      if (!(DESIGNS as readonly string[]).includes(item.design)) return false;
      if (
        !SIZE_KEYS.includes(item.size) ||
        !FINISH_KEYS.includes(item.finish) ||
        !GIFT_IDS.includes(item.gift)
      )
        return false;
      const sentences = sentenceCount(item.message);
      if (sentences < 1 || sentences > 4 || EMOJI.test(item.message) || item.message.length > 320)
        return false;
      if (item.reason.split(/\s+/).length > 14) return false;
      seen.add(item.key);
      return true;
    });
    if (clean.length === 0) throw new Error('no valid proposals in the reply');
    return clean;
  },
  fallback(input) {
    return input.proposals.map((p) => ({ key: p.key, ...p.current, reason: 'Built-in rules' }));
  },
  summary(output) {
    return `Drafted ${output.length} ${output.length === 1 ? 'proposal' : 'proposals'}`;
  },
});
