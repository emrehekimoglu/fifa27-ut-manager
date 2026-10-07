import type { FetchFn, SourceHealth } from '@fc27/data-sync';

/** Number of sample cards returned per source. */
export const SOURCE_HEALTH_SAMPLE_SIZE = 3;

/** Lets Vercel's CDN serve a cached report for 5 minutes, refreshing in the background. */
export const SOURCE_HEALTH_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=600';

export interface SourceHealthReport {
  readonly generatedAt: string;
  /** FUT.GG (primary) first, then EA (fallback). */
  readonly sources: readonly SourceHealth[];
}

export interface SourceHealthDeps {
  readonly fetch: FetchFn;
  readonly now: () => number;
}

export function handleSourceHealth(_deps: SourceHealthDeps): Promise<Response> {
  throw new Error('Not implemented');
}
