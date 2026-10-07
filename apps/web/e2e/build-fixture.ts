/** Build metadata injected into the app under test, so assertions can be exact. */
export const E2E_BUILD = {
  commitSha: '3f9c2a7d1e0b4c58a6d2e9f1b7c3a0d4e5f6a7b8',
  environment: 'preview',
} as const;

export const E2E_PORT = 4173;

/** Supabase project the app under test talks to; every request to it is answered by route mocks. */
export const E2E_SUPABASE = {
  url: 'https://supabase.e2e.test',
  publishableKey: 'sb_publishable_e2e',
} as const;
