import { defineConfig } from 'vitest/config';

// Integration tests against a local Supabase stack; see CONTRIBUTING.md.
export default defineConfig({
  test: {
    include: ['src/**/*.integration.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
