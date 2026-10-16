import type { Page } from '@playwright/test';

import { E2E_SUPABASE } from './build-fixture';

/** supabase-js keys the stored session by the first label of the project host. */
const STORAGE_KEY = `sb-${new URL(E2E_SUPABASE.url).hostname.split('.')[0]}-auth-token`;

export const IS_ALLOWED = `${E2E_SUPABASE.url}/rest/v1/rpc/is_allowed`;
export const LOGOUT = `${E2E_SUPABASE.url}/auth/v1/logout**`;

export const ALLOWED_EMAIL = 'oyuncu@example.com';
export const STRANGER_EMAIL = 'yabanci@example.com';

/** A session as supabase-js stores it after Google sign-in; it expires in 2100. */
function storedSession(email: string): string {
  return JSON.stringify({
    access_token: 'header.payload.signature',
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 4_102_444_800,
    user: {
      id: '0b5c8f5e-3c1d-4f3e-9a51-2f6c7d8e9a10',
      aud: 'authenticated',
      role: 'authenticated',
      email,
      app_metadata: { provider: 'google', providers: ['google'] },
      user_metadata: {},
      created_at: '2026-10-16T09:00:00Z',
    },
  });
}

/**
 * Starts every page load signed in with Google as `email`, and has the database
 * answer the allow-list check with `allowed`. Register it after any catch-all
 * route for the Supabase host, so its routes take precedence.
 */
export async function signIn(
  page: Page,
  { email = ALLOWED_EMAIL, allowed = true }: { email?: string; allowed?: boolean } = {},
): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, storedSession(email)] as const,
  );
  await page.route(IS_ALLOWED, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(allowed) }),
  );
}
