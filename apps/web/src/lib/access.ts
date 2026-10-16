import type { SupabaseClient } from '@supabase/supabase-js';

/** Who may use the app right now (PRD AUTH-1, AUTH-2). */
export type Access =
  | { readonly status: 'unconfigured' }
  | { readonly status: 'signed-out' }
  | { readonly status: 'allowed'; readonly email: string }
  | { readonly status: 'denied'; readonly email: string }
  | { readonly status: 'error'; readonly message: string };

/**
 * Reads the session stored on this device and asks the database whether its Google
 * account is on the allow-list. Row-level security enforces the same rule on every
 * query; this check only decides what the app shows (ADR-0008).
 */
export async function resolveAccess(client: SupabaseClient | null): Promise<Access> {
  if (client === null) return { status: 'unconfigured' };
  const { data } = await client.auth.getSession();
  const session = data.session;
  if (session === null) return { status: 'signed-out' };
  const email = session.user.email ?? '';
  const allowed = await client.rpc('is_allowed');
  if (allowed.error) return { status: 'error', message: allowed.error.message };
  return allowed.data === true ? { status: 'allowed', email } : { status: 'denied', email };
}

/** Starts Google sign-in; in a browser, Supabase then leaves the page for Google. */
export async function signInWithGoogle(
  client: SupabaseClient,
  returnTo: string,
): Promise<{ readonly url: string } | { readonly error: string }> {
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: returnTo },
  });
  return error ? { error: error.message } : { url: data.url };
}

/** Signs out on this device only, so the other devices stay signed in (AUTH-3). */
export async function signOut(client: SupabaseClient): Promise<void> {
  await client.auth.signOut({ scope: 'local' });
}

/** Where Google sign-in returns to: the current page, without the fragment. */
export function returnAddress(location: {
  readonly origin: string;
  readonly pathname: string;
  readonly search: string;
}): string {
  return `${location.origin}${location.pathname}${location.search}`;
}
