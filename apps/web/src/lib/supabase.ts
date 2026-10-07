import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser client using the publishable key (safe to expose; data is protected by
 * row-level security). Null when the deployment has no Supabase configuration.
 */
export function browserSupabase(): SupabaseClient | null {
  throw new Error('Not implemented');
}
