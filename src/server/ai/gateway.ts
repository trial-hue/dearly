import type { Actor } from '@/domain';
import { env } from '@/env';

import { claudeFromEnv, estimateCostMicroPence } from './claudeProvider';
import { JOBS, type JobInput, type JobName, type JobOutput } from './jobs';
import type { JobDef } from './jobs/types';
import { MockProvider } from './mockProvider';
import type { AiProvider } from './provider';

export interface RunResult<O> {
  result: O;
  by: 'ai' | 'rule';
  note: string | null;
  provider: string | null;
}

export interface DecisionSink {
  (input: {
    actor: Actor;
    job: string;
    summary: string;
    costMicroPence?: number;
    orderId?: string | null;
  }): Promise<unknown>;
}

let cached: AiProvider | null | undefined;

/** The configured provider: mock, Claude with a key, or none (fallbacks only). */
export function getProvider(): AiProvider | null {
  if (cached !== undefined) return cached;
  if (env.AI_PROVIDER === 'mock') cached = new MockProvider();
  else cached = claudeFromEnv();
  return cached;
}

export function resetProviderCache(): void {
  cached = undefined;
}

export type AiStatus =
  | { mode: 'ai'; label: string; provider: string }
  | { mode: 'rules'; label: string; provider: null };

export function aiStatus(): AiStatus {
  const p = getProvider();
  return p
    ? { mode: 'ai', label: p.name === 'Mock AI' ? 'Mock AI' : 'AI connected', provider: p.name }
    : { mode: 'rules', label: 'Built-in rules', provider: null };
}

async function defaultSink(input: Parameters<DecisionSink>[0]) {
  const { record } = await import('@/server/services/decisionLog');
  return record(input);
}

/**
 * Run one AI job: build the prompt, ask the provider, parse with the job's schema, validate the
 * allowed values, and on any failure use the rules-based fallback. Every run writes a decision.
 */
export async function runJob<J extends JobName>(
  job: J,
  input: JobInput<J>,
  opts: { provider?: AiProvider | null; sink?: DecisionSink; orderId?: string | null } = {},
): Promise<RunResult<JobOutput<J>>> {
  const def = JOBS[job] as unknown as JobDef<JobInput<J>, JobOutput<J>>;
  const provider = opts.provider === undefined ? getProvider() : opts.provider;
  const sink = opts.sink ?? defaultSink;

  if (!provider) {
    const result = def.fallback(input);
    await sink({
      actor: 'rule',
      job,
      summary: `${def.summary(result, input)} (built-in rules)`,
      orderId: opts.orderId,
    });
    return { result, by: 'rule', note: 'No AI provider configured', provider: null };
  }

  try {
    const prompt = def.buildPrompt(input);
    const completion = await provider.completeJson({
      job,
      tier: def.tier,
      prompt,
      maxTokens: def.maxTokens,
      input,
    });
    const parsed = def.schema.safeParse(completion.raw);
    if (!parsed.success)
      throw new Error(
        `reply did not match the schema: ${parsed.error.issues
          .map((i) => i.path.join('.') + ' ' + i.message)
          .join('; ')
          .slice(0, 200)}`,
      );
    const result = def.validate(parsed.data, input);
    await sink({
      actor: 'ai',
      job,
      summary: `${def.summary(result, input)} (${provider.name}, ${completion.model})`,
      costMicroPence: estimateCostMicroPence(
        def.tier,
        completion.inputTokens,
        completion.outputTokens,
      ),
      orderId: opts.orderId,
    });
    return { result, by: 'ai', note: null, provider: provider.name };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    const result = def.fallback(input);
    await sink({
      actor: 'rule',
      job,
      summary: `${def.summary(result, input)} (fell back to built-in rules: ${reason.slice(0, 120)})`,
      orderId: opts.orderId,
    });
    return { result, by: 'rule', note: reason, provider: provider.name };
  }
}
