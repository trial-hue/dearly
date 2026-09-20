import { z } from 'zod';

/**
 * Every environment variable the server reads, validated once at start-up. A missing or invalid
 * value throws here, so misconfiguration fails fast rather than at the first request.
 */
const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required (a postgres:// URL, or "embedded" for local runs)'),
    SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters'),
    APP_URL: z.url().default('http://localhost:3000'),
    ANTHROPIC_API_KEY: z
      .string()
      .optional()
      .transform((v) => (v && v.trim() ? v.trim() : undefined)),
    AI_PROVIDER: z.enum(['claude', 'mock']).default('claude'),
    AI_MODEL_QUICK: z.string().optional(),
    AI_MODEL_DEFAULT: z.string().optional(),
    RATE_LIMIT_AI_PER_MIN: z.coerce.number().int().positive().default(20),
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    STORAGE_PATH: z.string().default('./.data/uploads'),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    APP_VERSION: z.string().default('0.1.0'),
  })
  .superRefine((v, ctx) => {
    if (v.AI_PROVIDER === 'claude' && v.ANTHROPIC_API_KEY) {
      if (!v.AI_MODEL_QUICK)
        ctx.addIssue({
          code: 'custom',
          path: ['AI_MODEL_QUICK'],
          message: 'AI_MODEL_QUICK is required when an API key is set',
        });
      if (!v.AI_MODEL_DEFAULT)
        ctx.addIssue({
          code: 'custom',
          path: ['AI_MODEL_DEFAULT'],
          message: 'AI_MODEL_DEFAULT is required when an API key is set',
        });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

function load(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new Error(
      `Invalid environment:\n${lines.join('\n')}\nSee .env.example for every variable.`,
    );
  }
  return parsed.data;
}

export const env: Env = load();

/**
 * The connection string Prisma should use. "embedded" means the local cluster that
 * scripts/with-db.ts starts (port PGPORT, default 54329); with-db also sets DATABASE_URL to the
 * concrete URL for child processes, so this default only matters for a bare `next start`.
 */
export function databaseUrl(e: Env = env): string {
  if (e.DATABASE_URL !== 'embedded') return e.DATABASE_URL;
  const port = process.env.PGPORT ?? '54329';
  const name = process.env.PGDATABASE ?? 'dearly';
  return `postgresql://postgres:postgres@127.0.0.1:${port}/${name}`;
}

/** True when live AI calls can be made: the Claude provider with a key, or the mock provider. */
export function aiConfigured(e: Env = env): boolean {
  return e.AI_PROVIDER === 'mock' || Boolean(e.ANTHROPIC_API_KEY);
}
