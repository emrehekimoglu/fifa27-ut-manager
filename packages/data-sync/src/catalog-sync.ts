import type { CardSource, CatalogCard } from './catalog-card.js';
import type { CatalogStore } from './catalog-store.js';
import { checkCatalogSize } from './catalog-validation.js';

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

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** Fetches a catalog and checks its size; throws with the reason when it is not usable. */
async function fetchValid(
  fetchCatalog: () => Promise<readonly CatalogCard[]>,
  previousCardCount: number | null,
): Promise<readonly CatalogCard[]> {
  const cards = await fetchCatalog();
  const check = checkCatalogSize(cards.length, previousCardCount);
  if (!check.ok) throw new Error(check.reason);
  return cards;
}

/**
 * Refreshes the stored catalog. A failed or implausible fetch never touches the
 * stored cards, so the last good catalog stays in use (ADR-0005).
 */
export async function runCatalogSync(deps: CatalogSyncDeps): Promise<CatalogSyncResult> {
  const { store } = deps;
  const previousCardCount = await store.lastSuccessfulCardCount();
  const syncId = await store.startSync(new Date(deps.now()).toISOString());

  let source: CardSource = 'futgg';
  let cards: readonly CatalogCard[];
  try {
    cards = await fetchValid(deps.fetchPrimary, previousCardCount);
  } catch (primaryError) {
    if (previousCardCount !== null) {
      return finish(deps, { ...FAILED, syncId, error: messageOf(primaryError) });
    }
    try {
      cards = await fetchValid(deps.fetchFallback, null);
      source = 'ea';
    } catch (fallbackError) {
      const error = `${messageOf(primaryError)}; fallback: ${messageOf(fallbackError)}`;
      return finish(deps, { ...FAILED, syncId, error });
    }
  }

  await store.upsertCards(syncId, cards);
  const deactivatedCount = await store.deactivateCardsNotSeen(syncId);
  return finish(deps, {
    syncId,
    status: 'succeeded',
    source,
    cardCount: cards.length,
    deactivatedCount,
    error: null,
  });
}

const FAILED = {
  status: 'failed',
  source: null,
  cardCount: null,
  deactivatedCount: null,
} as const;

async function finish(
  deps: CatalogSyncDeps,
  result: CatalogSyncResult,
): Promise<CatalogSyncResult> {
  await deps.store.finishSync(result.syncId, {
    finishedAt: new Date(deps.now()).toISOString(),
    status: result.status,
    source: result.source,
    cardCount: result.cardCount,
    deactivatedCount: result.deactivatedCount,
    error: result.error,
  });
  return result;
}
