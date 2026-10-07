import { createClient } from '@supabase/supabase-js';

import type { CatalogCard } from './catalog-card.js';
import type { SyncRecord } from './catalog-store.js';
import { createSupabaseCatalogStore } from './supabase-catalog-store.js';
import { describeCatalogStoreContract } from '../test/catalog-store-contract.js';

// Runs against a local Supabase stack (`supabase start`), never against production.
const url = process.env['SUPABASE_URL'];
const key = process.env['SUPABASE_SECRET_KEY'];
if (!url || !key) {
  throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY of the local stack are required');
}
const client = createClient(url, key, { auth: { persistSession: false } });

const toIso = (value: string | null): string | null =>
  value === null ? null : new Date(value).toISOString();

async function cardIds(active: boolean): Promise<number[]> {
  const { data, error } = await client
    .from('cards')
    .select('ea_id')
    .eq('is_active', active)
    .order('ea_id');
  if (error) throw new Error(error.message);
  return data.map((row: { ea_id: number }) => row.ea_id);
}

describeCatalogStoreContract('SupabaseCatalogStore', async () => {
  const cleared = await client.from('cards').delete().gte('ea_id', 0);
  if (cleared.error) throw new Error(cleared.error.message);
  const syncsCleared = await client.from('catalog_syncs').delete().gte('id', 0);
  if (syncsCleared.error) throw new Error(syncsCleared.error.message);

  return {
    store: createSupabaseCatalogStore(client),
    card: async (eaId) => {
      const { data, error } = await client
        .from('cards')
        .select('data')
        .eq('ea_id', eaId)
        .maybeSingle<{ data: CatalogCard }>();
      if (error) throw new Error(error.message);
      return data?.data ?? null;
    },
    activeCardIds: () => cardIds(true),
    inactiveCardIds: () => cardIds(false),
    sync: async (id) => {
      const { data, error } = await client.from('catalog_syncs').select('*').eq('id', id).single<{
        id: number;
        started_at: string;
        finished_at: string | null;
        status: SyncRecord['status'];
        source: SyncRecord['source'];
        card_count: number | null;
        deactivated_count: number | null;
        error: string | null;
      }>();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        startedAt: toIso(data.started_at) ?? '',
        finishedAt: toIso(data.finished_at),
        status: data.status,
        source: data.source,
        cardCount: data.card_count,
        deactivatedCount: data.deactivated_count,
        error: data.error,
      } as SyncRecord;
    },
  };
});
