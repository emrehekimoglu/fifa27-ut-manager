import type { CardSource, CatalogCard } from './catalog-card.js';
import { fetchEaRatingsPage } from './ea.js';
import { FUTGG_QUERY_RESULT_CAP, fetchFutggDefinitionsPage } from './futgg.js';
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

/** Health of every card source at one point in time; primary source first. */
export interface SourceHealthReport {
  readonly generatedAt: string;
  readonly sources: readonly SourceHealth[];
}

export interface HealthCheckDeps {
  readonly fetch: FetchFn;
  /** Milliseconds since the epoch. */
  readonly now: () => number;
  readonly sampleSize: number;
}

interface Probe {
  readonly cards: readonly CatalogCard[];
  readonly total: number;
  readonly totalIsCapped: boolean;
}

async function probe(source: CardSource, deps: HealthCheckDeps, startedAt: number): Promise<Probe> {
  if (source === 'futgg') {
    const page = await fetchFutggDefinitionsPage(1, deps.fetch);
    return {
      cards: page.cards,
      total: page.total,
      totalIsCapped: page.total >= FUTGG_QUERY_RESULT_CAP,
    };
  }
  const page = await fetchEaRatingsPage(
    { offset: 0, limit: deps.sampleSize, cacheBust: String(startedAt) },
    deps.fetch,
  );
  return { cards: page.cards, total: page.totalItems, totalIsCapped: false };
}

export async function checkSourceHealth(
  source: CardSource,
  deps: HealthCheckDeps,
): Promise<SourceHealth> {
  const startedAt = deps.now();
  const checkedAt = new Date(startedAt).toISOString();
  try {
    const result = await probe(source, deps, startedAt);
    return {
      source,
      status: 'ok',
      checkedAt,
      latencyMs: deps.now() - startedAt,
      totalCards: result.total,
      totalIsCapped: result.totalIsCapped,
      sample: result.cards.slice(0, deps.sampleSize),
      error: null,
    };
  } catch (error) {
    return {
      source,
      status: 'error',
      checkedAt,
      latencyMs: deps.now() - startedAt,
      totalCards: null,
      totalIsCapped: false,
      sample: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
