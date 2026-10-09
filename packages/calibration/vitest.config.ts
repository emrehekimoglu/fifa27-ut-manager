import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Test against the package sources, so tests and mutation runs need no prior build.
    alias: {
      '@fc27/data-sync': fileURLToPath(new URL('../data-sync/src/index.ts', import.meta.url)),
      '@fc27/domain': fileURLToPath(new URL('../domain/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        // Wiring of real dependencies; exercised by the calibration workflow.
        'src/cli/**',
      ],
      reporter: ['text', 'html'],
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
    },
  },
});
