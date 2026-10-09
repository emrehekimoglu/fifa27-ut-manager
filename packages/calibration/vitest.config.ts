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
    // The fit tests solve nine least-squares problems; mutation runs instrument every
    // arithmetic step and run several packages at once, so allow well above their ~0.4 s.
    testTimeout: 30_000,
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
