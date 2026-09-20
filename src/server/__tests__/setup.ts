import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// The environment a service needs. DATABASE_URL comes from scripts/with-db.ts (embedded) or CI.
process.env.SESSION_SECRET ??= 'service-tests-secret-not-for-production';
process.env.AI_PROVIDER ??= 'mock';
process.env.STORAGE_DRIVER ??= 'local';
process.env.STORAGE_PATH ??= mkdtempSync(path.join(tmpdir(), 'dearly-uploads-'));
process.env.LOG_LEVEL ??= 'silent';
process.env.APP_URL ??= 'http://localhost:3000';
if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'embedded') {
  process.env.DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${process.env.PGPORT ?? '54329'}/${process.env.PGDATABASE ?? 'dearly'}`;
}
