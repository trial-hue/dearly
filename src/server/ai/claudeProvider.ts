import Anthropic from '@anthropic-ai/sdk';

import { env } from '@/env';

import {
  extractJson,
  type AiProvider,
  type CompletionArgs,
  type CompletionResult,
} from './provider';

/**
 * Claude through Anthropic's official TypeScript SDK. Model identifiers come from the environment
 * (AI_MODEL_QUICK, AI_MODEL_DEFAULT); nothing is hard-coded. The quick tier answers without
 * extended thinking; the default tier keeps adaptive thinking at a modest effort.
 */
export class ClaudeProvider implements AiProvider {
  readonly name = 'Claude';
  private readonly client: Anthropic;
  private readonly models: { quick: string; default: string };

  constructor(apiKey: string, models: { quick: string; default: string }) {
    this.client = new Anthropic({ apiKey, maxRetries: 2, timeout: 60_000 });
    this.models = models;
  }

  async completeJson(args: CompletionArgs): Promise<CompletionResult> {
    const model = this.models[args.tier];
    const response = await this.client.messages.create({
      model,
      max_tokens: args.maxTokens,
      messages: [{ role: 'user', content: args.prompt }],
      ...(args.tier === 'default' ? { output_config: { effort: 'medium' } } : {}),
    });
    if (response.stop_reason === 'refusal') throw new Error('the model declined this request');
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
    if (!text.trim()) throw new Error('empty reply');
    return {
      raw: extractJson(text),
      text,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }
}

export function claudeFromEnv(): ClaudeProvider | null {
  if (!env.ANTHROPIC_API_KEY || !env.AI_MODEL_QUICK || !env.AI_MODEL_DEFAULT) return null;
  return new ClaudeProvider(env.ANTHROPIC_API_KEY, {
    quick: env.AI_MODEL_QUICK,
    default: env.AI_MODEL_DEFAULT,
  });
}

/** Rough cost in micro-pence from token counts, for the decision log. Pilot assumption: £0.78 to $1. */
export function estimateCostMicroPence(
  tier: 'quick' | 'default',
  inputTokens: number,
  outputTokens: number,
): number {
  const usdPerMillion = tier === 'quick' ? { in: 1, out: 5 } : { in: 5, out: 25 };
  const usd = (inputTokens * usdPerMillion.in + outputTokens * usdPerMillion.out) / 1_000_000;
  return Math.round(usd * 0.78 * 100 * 1_000_000);
}
