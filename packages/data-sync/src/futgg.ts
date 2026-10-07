import type { CatalogCard } from './catalog-card.js';
import type { FetchFn } from './http.js';

export const FUTGG_DEFINITIONS_URL = 'https://www.fut.gg/api/fut/players/v2/27/definitions/';
export const FUTGG_IMAGE_BASE_URL =
  'https://game-assets.fut.gg/cdn-cgi/image/quality=85,format=auto,width=300/';
/** FUT.GG never returns more than this many results for a single query. */
export const FUTGG_QUERY_RESULT_CAP = 10_000;

export interface FutggDefinitionsPage {
  readonly cards: readonly CatalogCard[];
  readonly currentPage: number;
  readonly nextPage: number | null;
  readonly total: number;
}

export function parseFutggDefinitionsPage(_json: unknown): FutggDefinitionsPage {
  throw new Error('Not implemented');
}

export function fetchFutggDefinitionsPage(
  _page: number,
  _fetchFn: FetchFn,
): Promise<FutggDefinitionsPage> {
  throw new Error('Not implemented');
}
