import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['**/*.service.spec.ts', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts'],
      exclude: ['src/domain/**/__tests__/**', 'src/domain/types.ts'],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 80 },
      reporter: ['text', 'html'],
    },
  },
});
