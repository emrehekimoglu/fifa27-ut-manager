import type { SupabaseClient } from '@supabase/supabase-js';

import type { SyncRecord } from '@fc27/data-sync';

/** The most recent catalog sync, or null when none has run yet. */
export function fetchLatestCatalogSync(_client: SupabaseClient): Promise<SyncRecord | null> {
  throw new Error('Not implemented');
}

export function syncStatusLabel(_status: SyncRecord['status']): string {
  throw new Error('Not implemented');
}

/** Date and time of a sync in the users' time zone (Türkiye), e.g. "7 Ekim 2026 06:47". */
export function formatSyncTime(_isoTimestamp: string): string {
  throw new Error('Not implemented');
}
