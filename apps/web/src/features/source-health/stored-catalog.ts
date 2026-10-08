import type { SupabaseClient } from '@supabase/supabase-js';

import type { CatalogCard } from '@fc27/data-sync';

/**
 * FUT.GG data as stored by the daily catalog sync. FUT.GG rejects requests from
 * Vercel's servers (HTTP 403), so the source page reports what reached the database.
 */
export interface StoredFutggCatalog {
  /** 'ok' when the latest finished sync wrote FUT.GG data; null before any finished sync. */
  readonly status: 'ok' | 'error' | null;
  readonly error: string | null;
  /** When FUT.GG data was last written successfully; null if never. */
  readonly lastFetchedAt: string | null;
  readonly activeCardCount: number;
  /** The highest-rated active FUT.GG cards. */
  readonly sample: readonly CatalogCard[];
}

export function fetchStoredFutggCatalog(
  _client: SupabaseClient,
  _sampleSize: number,
): Promise<StoredFutggCatalog> {
  throw new Error('Not implemented');
}
