import type { CatalogCard } from './catalog-card.js';
import { FUTGG_QUERY_RESULT_CAP, fetchFutggDefinitionsPage } from './futgg.js';
import type { OverallRange } from './futgg.js';
import type { FetchFn } from './http.js';

export type { OverallRange } from './futgg.js';

/**
 * Overall-rating bands that split the catalog into queries below FUT.GG's
 * 10,000-result cap. Largest band at launch: 65-69 with 5,925 cards (ADR-0005).
 */
export const CATALOG_PARTITIONS: readonly OverallRange[] = [
  { min: 0, max: 59 },
  { min: 60, max: 64 },
  { min: 65, max: 69 },
  { min: 70, max: 74 },
  { min: 75, max: 79 },
  { min: 80, max: 84 },
  { min: 85, max: 99 },
];

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

export async function fetchFutggCatalog(deps: CatalogFetchDeps): Promise<CatalogCard[]> {
  let requestCount = 0;
  const fetchPage = async (page: number, range: OverallRange) => {
    if (requestCount > 0) await deps.sleep(deps.delayMs);
    requestCount += 1;
    return fetchFutggDefinitionsPage(page, deps.fetch, range);
  };

  const catalog = new Map<number, CatalogCard>();
  for (const range of deps.partitions) {
    const label = `${range.min}-${range.max}`;
    const partition = new Map<number, CatalogCard>();
    let total = 0;
    for (let pass = 1; pass <= MAX_PARTITION_PASSES; pass += 1) {
      let page: number | null = 1;
      while (page !== null) {
        const result = await fetchPage(page, range);
        // The latest page's total is the freshest count; cards may be added mid-crawl.
        total = result.total;
        if (total >= FUTGG_QUERY_RESULT_CAP) {
          throw new CatalogFetchError(
            `partition ${label} reports ${total} cards, at the FUT.GG query cap`,
          );
        }
        for (const card of result.cards) partition.set(card.eaId, card);
        page = result.nextPage;
      }
      if (partition.size >= total) break;
    }
    if (partition.size < total) {
      throw new CatalogFetchError(
        `partition ${label}: collected ${partition.size} of ${total} cards after ${MAX_PARTITION_PASSES} passes`,
      );
    }
    for (const [eaId, card] of partition) catalog.set(eaId, card);
  }
  return [...catalog.values()];
}

export interface EaCatalogFetchDeps {
  readonly fetch: FetchFn;
  readonly sleep: (milliseconds: number) => Promise<void>;
  readonly delayMs: number;
  readonly pageSize: number;
  /** Unique per run; EA's CDN caches by URL. */
  readonly cacheBust: string;
}

/** Reads every base card from EA's ratings API, page by page. */
export function fetchEaCatalog(_deps: EaCatalogFetchDeps): Promise<CatalogCard[]> {
  throw new Error('Not implemented');
}
