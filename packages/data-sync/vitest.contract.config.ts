import { defineConfig } from 'vitest/config';

// Live contract tests against the real sources. Not part of the PR gate: they
// depend on third-party availability and run on a schedule (see ci workflow).
export default defineConfig({
  test: {
    include: ['src/**/*.contract.ts'],
    environment: 'node',
    testTimeout: 60_000,
  },
});
