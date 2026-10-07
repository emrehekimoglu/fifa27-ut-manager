import type { CatalogCard } from './catalog-card.js';
import type { FetchFn } from './http.js';

export const EA_RATINGS_URL = 'https://drop-api.ea.com/rating/ea-sports-fc';
/** Without this header the API serves the previous game's ratings. */
export const EA_RATINGS_REFERRER = 'https://www.ea.com/games/ea-sports-fc/ratings';

export interface EaRatingsPage {
  readonly cards: readonly CatalogCard[];
  readonly totalItems: number;
}

export interface EaRatingsQuery {
  readonly offset: number;
  readonly limit: number;
  /** The CDN caches by URL only, so every request carries a unique value. */
  readonly cacheBust: string;
}

export function parseEaRatingsPage(_json: unknown): EaRatingsPage {
  throw new Error('Not implemented');
}

export function fetchEaRatingsPage(
  _query: EaRatingsQuery,
  _fetchFn: FetchFn,
): Promise<EaRatingsPage> {
  throw new Error('Not implemented');
}
