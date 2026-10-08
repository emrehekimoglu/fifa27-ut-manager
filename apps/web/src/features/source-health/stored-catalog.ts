import type { SupabaseClient } from '@supabase/supabase-js';

import type { CardSource, CatalogCard } from '@fc27/data-sync';

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

/** Shown when a sync fell back to EA without recording why FUT.GG failed. */
export const EA_FALLBACK_MESSAGE = 'Son senkronizasyon yedek kaynaktan (EA) yapıldı.';

interface FinishedSyncRow {
  readonly status: 'succeeded' | 'failed';
  readonly source: CardSource | null;
  readonly error: string | null;
}

type QueryResult<T> =
  | { readonly data: T[]; readonly error: null }
  | { readonly data: null; readonly error: { readonly message: string } };

function rowsOf<T>(result: QueryResult<T>): T[] {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function fetchStoredFutggCatalog(
  client: SupabaseClient,
  sampleSize: number,
): Promise<StoredFutggCatalog> {
  const [latest, lastSuccess, cards] = await Promise.all([
    client
      .from('catalog_syncs')
      .select('status,source,error')
      .in('status', ['succeeded', 'failed'])
      .order('id', { ascending: false })
      .limit(1)
      .overrideTypes<FinishedSyncRow[], { merge: false }>(),
    client
      .from('catalog_syncs')
      .select('finished_at')
      .eq('status', 'succeeded')
      .eq('source', 'futgg')
      .order('id', { ascending: false })
      .limit(1)
      .overrideTypes<{ finished_at: string }[], { merge: false }>(),
    client
      .from('cards')
      .select('data', { count: 'exact' })
      .eq('source', 'futgg')
      .eq('is_active', true)
      .order('overall', { ascending: false })
      .order('ea_id')
      .limit(sampleSize)
      .overrideTypes<{ data: CatalogCard }[], { merge: false }>(),
  ]);
  const sync = rowsOf(latest)[0];
  const fetchedAt = rowsOf(lastSuccess)[0]?.finished_at;
  const sample = rowsOf(cards).map((row) => row.data);
  const wroteFutgg = sync?.status === 'succeeded' && sync.source === 'futgg';
  return {
    status: sync === undefined ? null : wroteFutgg ? 'ok' : 'error',
    error: sync === undefined || wroteFutgg ? null : (sync.error ?? EA_FALLBACK_MESSAGE),
    lastFetchedAt: fetchedAt === undefined ? null : new Date(fetchedAt).toISOString(),
    activeCardCount: cards.count ?? 0,
    sample,
  };
}
