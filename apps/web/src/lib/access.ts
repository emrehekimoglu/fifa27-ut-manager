import type { SupabaseClient } from '@supabase/supabase-js';

/** Who may use the app right now (PRD AUTH-1, AUTH-2). */
export type Access =
  | { readonly status: 'unconfigured' }
  | { readonly status: 'signed-out' }
  | { readonly status: 'allowed'; readonly email: string }
  | { readonly status: 'denied'; readonly email: string }
  | { readonly status: 'error'; readonly message: string };

export function resolveAccess(_client: SupabaseClient | null): Promise<Access> {
  throw new Error('Not implemented');
}

export function signInWithGoogle(
  _client: SupabaseClient,
  _returnTo: string,
): Promise<{ readonly url: string } | { readonly error: string }> {
  throw new Error('Not implemented');
}

export function signOut(_client: SupabaseClient): Promise<void> {
  throw new Error('Not implemented');
}

export function returnAddress(_location: {
  readonly origin: string;
  readonly pathname: string;
  readonly search: string;
}): string {
  throw new Error('Not implemented');
}
