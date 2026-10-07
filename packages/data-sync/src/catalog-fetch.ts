import type { CatalogCard } from './catalog-card.js';
import type { FetchFn } from './http.js';

export interface OverallRange {
  readonly min: number;
  readonly max: number;
}

/**
 * Overall-rating bands that split the catalog into queries below FUT.GG's
 * 10,000-result cap. Largest band at launch: 65-69 with 5,925 cards (ADR-0005).
 */
export const CATALOG_PARTITIONS: readonly OverallRange[] = [];

/** Pages of a partition are re-read at most this often to recover cards lost to unstable paging. */
export const MAX_PARTITION_PASSES = 3;

export class CatalogFetchError extends Error {
  constructor(message: string) {
    super(`[futgg] ${message}`);
    this.name = 'CatalogFetchError';
  }
}

export interface CatalogFetchDeps {
  readonly fetch: FetchFn;
  readonly sleep: (milliseconds: number) => Promise<void>;
  /** Pause before every request except the first, to keep the load on FUT.GG low. */
  readonly delayMs: number;
  readonly partitions: readonly OverallRange[];
}

export function fetchFutggCatalog(_deps: CatalogFetchDeps): Promise<CatalogCard[]> {
  throw new Error('Not implemented');
}
