import type { SupabaseClient } from '@supabase/supabase-js';

import type { CatalogStore } from './catalog-store.js';

/** CatalogStore backed by the Supabase tables defined in supabase/migrations. */
export function createSupabaseCatalogStore(_client: SupabaseClient): CatalogStore {
  throw new Error('Not implemented');
}
