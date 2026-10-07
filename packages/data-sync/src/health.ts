import type { CardSource, CatalogCard } from './catalog-card.js';
import type { FetchFn } from './http.js';

export interface SourceHealth {
  readonly source: CardSource;
  readonly status: 'ok' | 'error';
  readonly checkedAt: string;
  readonly latencyMs: number;
  /** Number of cards the source reports; null when the check failed. */
  readonly totalCards: number | null;
  /** True when the reported total is a query cap rather than the catalog size. */
  readonly totalIsCapped: boolean;
  readonly sample: readonly CatalogCard[];
  readonly error: string | null;
}

export interface HealthCheckDeps {
  readonly fetch: FetchFn;
  /** Milliseconds since the epoch. */
  readonly now: () => number;
  readonly sampleSize: number;
}

export function checkSourceHealth(
  _source: CardSource,
  _deps: HealthCheckDeps,
): Promise<SourceHealth> {
  throw new Error('Not implemented');
}
