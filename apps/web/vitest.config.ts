import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Test against the package source, so tests and mutation runs need no prior build.
    alias: {
      '@fc27/data-sync': fileURLToPath(
        new URL('../../packages/data-sync/src/index.ts', import.meta.url),
      ),
      '@fc27/domain': fileURLToPath(new URL('../../packages/domain/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/features/**/*.ts', 'server/**/*.ts'],
      // price-access.ts is a static table of spike results, verified by the e2e suite.
      exclude: ['**/*.test.ts', 'src/features/**/price-access.ts'],
      reporter: ['text', 'html'],
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
    },
  },
});
