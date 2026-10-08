import type { SupabaseClient } from '@supabase/supabase-js';

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

/** Active cards matching the search, best first. */
export function searchCatalog(
  _client: SupabaseClient,
  _search: CatalogSearch,
): Promise<CatalogResultPage> {
  throw new Error('Not implemented');
}

/** One stored card by its EA id, active or not; null when it is unknown. */
export function fetchCard(_client: SupabaseClient, _eaId: number): Promise<StoredCard | null> {
  throw new Error('Not implemented');
}
