import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.contract.ts',
        'src/**/*.integration.ts',
        // Covered by the CatalogStore contract suite against Supabase (test:integration).
        'src/supabase-catalog-store.ts',
        'src/index.ts',
        // Wiring of real dependencies; exercised by the scheduled sync workflow.
        'src/cli/**',
      ],
      reporter: ['text', 'html'],
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
    },
  },
});
