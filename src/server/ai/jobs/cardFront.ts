import { z } from 'zod';

import { sanitiseSvg } from '@/domain';

import { PROMPT_HEAD, RULES_LINE, defineJob } from './types';

export interface CardFrontInput {
  occasion: string;
  title: string;
  firstName: string;
  age: number | null;
  designHint: string;
}

export interface CardFrontOutput {
  svg: string | null;
}

const Output = z.object({ svg: z.string().min(10).max(30_000).nullable() });

export const cardFrontJob = defineJob<CardFrontInput, CardFrontOutput>({
  tier: 'default',
  maxTokens: 6000,
  buildPrompt(input) {
    return [
      `${PROMPT_HEAD} Design the front of a greeting card as a single SVG.`,
      `${RULES_LINE} Canvas viewBox="0 0 264 370", paper background #FFFDF7, ink #1F1A15, at most three accent colours, simple flat shapes, the title text "${input.title}" set in a bold sans-serif, and the name "${input.firstName}" smaller. Under 15 KB. No script, no foreignObject, no images, no links, no external references, no event attributes.`,
      `Data: ${JSON.stringify({ occasion: input.occasion, age: input.age, designHint: input.designHint })}`,
      'Reply with only JSON in this shape: {"svg": string}. Example: {"svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 264 370\\">...</svg>"}',
    ].join('\n');
  },
  schema: Output as unknown as z.ZodType<CardFrontOutput>,
  validate(output) {
    if (output.svg == null) return { svg: null }; // the model may decline
    const clean = sanitiseSvg(output.svg);
    if (!clean) throw new Error('svg rejected by the sanitiser');
    return { svg: clean };
  },
  fallback() {
    return { svg: null };
  },
  summary(output) {
    return output.svg ? 'Drew a card front' : 'Kept the stock card front';
  },
});
