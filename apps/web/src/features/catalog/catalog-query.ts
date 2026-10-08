import type { SupabaseClient } from '@supabase/supabase-js';

import { toSearchName } from '@fc27/data-sync';
import type { CatalogCard, Position } from '@fc27/data-sync';

/** Cards per catalog page. */
export const CATALOG_PAGE_SIZE = 30;

export interface CatalogSearch {
  /** Free text matched against card names, ignoring case and accents. */
  readonly query: string;
  /** Only cards that can play this position, as primary or alternate position. */
  readonly position: Position | null;
  /** 1-based page number. */
  readonly page: number;
}

export interface CatalogResultPage {
  readonly cards: readonly CatalogCard[];
  /** Number of matching cards across all pages. */
  readonly total: number;
}

export interface StoredCard {
  readonly card: CatalogCard;
  /** False once the source no longer lists the card (ADR-0005). */
  readonly isActive: boolean;
}

type QueryResult<T> =
  | { readonly data: T[]; readonly count: number | null; readonly error: null }
  | { readonly data: null; readonly error: { readonly message: string } };

function rowsOf<T>(result: QueryResult<T>): T[] {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

/** Escapes LIKE wildcards, so they match literally. */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (character) => `\\${character}`);

/** Active cards matching the search, best first. */
export async function searchCatalog(
  client: SupabaseClient,
  search: CatalogSearch,
): Promise<CatalogResultPage> {
  let query = client.from('cards').select('data', { count: 'exact' }).eq('is_active', true);
  const name = toSearchName(search.query);
  if (name !== '') query = query.ilike('search_name', `%${escapeLike(name)}%`);
  if (search.position !== null) {
    const { position } = search;
    query = query.or(`position.eq.${position},alternate_positions.cs.{${position}}`);
  }
  const from = (search.page - 1) * CATALOG_PAGE_SIZE;
  const result = await query
    .order('overall', { ascending: false })
    .order('ea_id')
    .range(from, from + CATALOG_PAGE_SIZE - 1)
    .overrideTypes<{ data: CatalogCard }[], { merge: false }>();
  const rows = rowsOf(result);
  return { cards: rows.map((row) => row.data), total: result.count ?? 0 };
}

/** One stored card by its EA id, active or not; null when it is unknown. */
export async function fetchCard(client: SupabaseClient, eaId: number): Promise<StoredCard | null> {
  const result = await client
    .from('cards')
    .select('data,is_active')
    .eq('ea_id', eaId)
    .limit(1)
    .overrideTypes<{ data: CatalogCard; is_active: boolean }[], { merge: false }>();
  const row = rowsOf(result)[0];
  return row === undefined ? null : { card: row.data, isActive: row.is_active };
}
