import type { z } from 'zod';

import type { Tier } from '../provider';

export interface JobDef<I, O> {
  tier: Tier;
  maxTokens: number;
  buildPrompt(input: I): string;
  schema: z.ZodType<O>;
  /** Check allowed values against the input; throw to reject the whole answer. */
  validate(output: O, input: I): O;
  fallback(input: I): O;
  summary(output: O, input: I): string;
}

export const PROMPT_HEAD = 'You are part of Dearly, a UK greeting card service.';
export const RULES_LINE = 'Rules: British English. No emojis.';

export function defineJob<I, O>(def: JobDef<I, O>): JobDef<I, O> {
  return def;
}
