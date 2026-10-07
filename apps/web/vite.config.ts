import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import packageJson from './package.json' with { type: 'json' };

// Vercel provides VERCEL_GIT_COMMIT_SHA and VERCEL_ENV at build time.
// APP_COMMIT_SHA and APP_ENV allow the same values to be injected elsewhere (CI, e2e).
const env = process.env;

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_INFO__: JSON.stringify({
      version: packageJson.version,
      commitSha: env['VERCEL_GIT_COMMIT_SHA'] ?? env['APP_COMMIT_SHA'] ?? '',
      environment: env['VERCEL_ENV'] ?? env['APP_ENV'] ?? 'development',
    }),
  },
});
