import path from 'node:path';

import { defineConfig } from 'vitest/config';

/**
 * Service-layer conformance tests: real services against the embedded PostgreSQL that
 * scripts/with-db.ts starts. Run with `pnpm test:service`. Files share one database, so they
 * run one at a time and each test reseeds.
 */
export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['src/server/**/*.service.spec.ts'],
    setupFiles: ['src/server/__tests__/setup.ts'],
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
