import type { CardSource, CatalogCard } from './catalog-card.js';
import type { CatalogStore } from './catalog-store.js';

export interface CatalogSyncDeps {
  readonly store: CatalogStore;
  /** Fetches the full catalog from FUT.GG. */
  readonly fetchPrimary: () => Promise<readonly CatalogCard[]>;
  /** Fetches the base-card catalog from EA; only used while the catalog is still empty. */
  readonly fetchFallback: () => Promise<readonly CatalogCard[]>;
  /** Milliseconds since the epoch. */
  readonly now: () => number;
}

export interface CatalogSyncResult {
  readonly syncId: number;
  readonly status: 'succeeded' | 'failed';
  readonly source: CardSource | null;
  readonly cardCount: number | null;
  readonly deactivatedCount: number | null;
  readonly error: string | null;
}

export function runCatalogSync(_deps: CatalogSyncDeps): Promise<CatalogSyncResult> {
  throw new Error('Not implemented');
}
