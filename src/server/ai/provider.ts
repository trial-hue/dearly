export type Tier = 'quick' | 'default';

export interface CompletionArgs {
  job: string;
  tier: Tier;
  prompt: string;
  maxTokens: number;
  /** The job input, so a mock can answer sensibly. Never sent to a real provider. */
  input: unknown;
}

export interface CompletionResult {
  raw: unknown;
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface AiProvider {
  readonly name: string;
  completeJson(args: CompletionArgs): Promise<CompletionResult>;
}

/** Read the model's reply as one JSON value: bare, fenced, or with a sentence around it. */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  const candidate = fence?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const starts = [candidate.indexOf('{'), candidate.indexOf('[')].filter((i) => i >= 0);
    if (starts.length === 0) throw new Error('no JSON in reply');
    const start = Math.min(...starts);
    const end = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'));
    if (end <= start) throw new Error('no JSON in reply');
    return JSON.parse(candidate.slice(start, end + 1));
  }
}
