import type { SupabaseClient } from '@supabase/supabase-js';

import type { CatalogCard } from './catalog-card.js';
import type { CatalogStore, FinishedSync } from './catalog-store.js';
import { toSearchName } from './search-name.js';

/** Rows per upsert request; keeps each request well below PostgREST's payload limits. */
const UPSERT_BATCH_SIZE = 500;

function fail(operation: string, error: { message: string }): never {
  throw new Error(`[supabase] ${operation}: ${error.message}`);
}

function toRow(card: CatalogCard, syncId: number) {
  return {
    ea_id: card.eaId,
    base_player_ea_id: card.basePlayerEaId,
    name: card.name,
    search_name: toSearchName(card.name),
    overall: card.overall,
    position: card.position,
    alternate_positions: card.alternatePositions,
    rarity_ea_id: card.rarity?.eaId ?? null,
    rarity_name: card.rarity?.name ?? null,
    club_ea_id: card.club.eaId,
    club_name: card.club.name,
    league_ea_id: card.league.eaId,
    league_name: card.league.name,
    nation_ea_id: card.nation.eaId,
    nation_name: card.nation.name,
    is_untradeable: card.isUntradeable,
    source: card.source,
    data: card,
    is_active: true,
    last_seen_sync_id: syncId,
    updated_at: new Date().toISOString(),
  };
}

/** CatalogStore backed by the Supabase tables defined in supabase/migrations. */
export function createSupabaseCatalogStore(client: SupabaseClient): CatalogStore {
  return {
    async lastSuccessfulCardCount() {
      const { data, error } = await client
        .from('catalog_syncs')
        .select('card_count')
        .eq('status', 'succeeded')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle<{ card_count: number | null }>();
      if (error) fail('read last successful sync', error);
      return data?.card_count ?? null;
    },

    async startSync(startedAt) {
      const { data, error } = await client
        .from('catalog_syncs')
        .insert({ started_at: startedAt, status: 'running' })
        .select('id')
        .single<{ id: number }>();
      if (error) fail('start sync', error);
      return data.id;
    },

    async upsertCards(syncId, cards) {
      for (let start = 0; start < cards.length; start += UPSERT_BATCH_SIZE) {
        const rows = cards
          .slice(start, start + UPSERT_BATCH_SIZE)
          .map((card) => toRow(card, syncId));
        const { error } = await client.from('cards').upsert(rows, { onConflict: 'ea_id' });
        if (error) fail('upsert cards', error);
      }
    },

    async deactivateCardsNotSeen(syncId) {
      const { count, error } = await client
        .from('cards')
        .update({ is_active: false }, { count: 'exact' })
        .eq('is_active', true)
        .neq('last_seen_sync_id', syncId);
      if (error) fail('deactivate unseen cards', error);
      return count ?? 0;
    },

    async finishSync(syncId, result: FinishedSync) {
      const { error } = await client
        .from('catalog_syncs')
        .update({
          finished_at: result.finishedAt,
          status: result.status,
          source: result.source,
          card_count: result.cardCount,
          deactivated_count: result.deactivatedCount,
          error: result.error,
        })
        .eq('id', syncId);
      if (error) fail('finish sync', error);
    },
  };
}
