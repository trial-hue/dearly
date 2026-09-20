import { z } from 'zod';

import { EMOJI, isOccasionType, messageFor, sentenceCount, templateCount } from '@/domain';

import { PROMPT_HEAD, RULES_LINE, defineJob } from './types';

export interface RewriteInput {
  sender: string;
  firstName: string;
  relationship: string;
  occasion: string;
  age: number | null;
  current: string;
}

const Output = z.object({ message: z.string().min(1).max(400) });
export type RewriteOutput = z.infer<typeof Output>;

export const rewriteMessageJob = defineJob<RewriteInput, RewriteOutput>({
  tier: 'default',
  maxTokens: 400,
  buildPrompt(input) {
    return [
      `${PROMPT_HEAD} Rewrite one greeting card message so it reads differently from the current one while keeping the sentiment.`,
      `${RULES_LINE} 1 to 3 sentences, under 320 characters, warm and specific, ending with a sign-off from "${input.sender}". Mention the age only if it is a milestone.`,
      `Data: ${JSON.stringify({ firstName: input.firstName, relationship: input.relationship, occasion: input.occasion, age: input.age, current: input.current })}`,
      'Reply with only JSON in this shape: {"message": string}. Example: {"message":"Happy birthday, Dan. Here is to another year of terrible puns and good company. Love, Alex"}',
    ].join('\n');
  },
  schema: Output,
  validate(output) {
    const s = sentenceCount(output.message);
    if (s < 1 || s > 4) throw new Error('message must be 1 to 3 sentences');
    if (output.message.length > 320) throw new Error('message too long');
    if (EMOJI.test(output.message)) throw new Error('no emoji');
    return { message: output.message.trim() };
  },
  fallback(input) {
    const type = isOccasionType(input.occasion) ? input.occasion : 'birthday';
    const ctx = {
      name: input.firstName,
      age: input.age,
      relationship: input.relationship,
      sender: input.sender,
    };
    const count = templateCount(type, input.age);
    let variant = 0;
    for (let i = 0; i < count; i++)
      if (messageFor(type, ctx, i) === input.current) variant = (i + 1) % count;
    return { message: messageFor(type, ctx, variant) };
  },
  summary(_output, input) {
    return `Rewrote the message for ${input.firstName}`;
  },
});
