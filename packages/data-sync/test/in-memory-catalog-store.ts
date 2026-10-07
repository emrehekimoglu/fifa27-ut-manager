import type { CatalogCard } from '../src/catalog-card.js';
import type { CatalogStore, FinishedSync, SyncRecord } from '../src/catalog-store.js';

export interface StoredCard {
  readonly card: CatalogCard;
  readonly isActive: boolean;
  readonly lastSeenSyncId: number;
}

/**
 * Test double for the database boundary. The shared store contract suite runs
 * against this and against the Supabase store, so both behave the same.
 */
export class InMemoryCatalogStore implements CatalogStore {
  readonly cards = new Map<number, StoredCard>();
  readonly syncs: SyncRecord[] = [];

  lastSuccessfulCardCount(): Promise<number | null> {
    const succeeded = this.syncs.filter((sync) => sync.status === 'succeeded');
    return Promise.resolve(succeeded.at(-1)?.cardCount ?? null);
  }

  startSync(startedAt: string): Promise<number> {
    const id = this.syncs.length + 1;
    this.syncs.push({ id, startedAt, status: 'running' });
    return Promise.resolve(id);
  }

  upsertCards(syncId: number, cards: readonly CatalogCard[]): Promise<void> {
    for (const card of cards) {
      this.cards.set(card.eaId, { card, isActive: true, lastSeenSyncId: syncId });
    }
    return Promise.resolve();
  }

  deactivateCardsNotSeen(syncId: number): Promise<number> {
    let changed = 0;
    for (const [eaId, stored] of this.cards) {
      if (stored.isActive && stored.lastSeenSyncId !== syncId) {
        this.cards.set(eaId, { ...stored, isActive: false });
        changed += 1;
      }
    }
    return Promise.resolve(changed);
  }

  finishSync(syncId: number, result: FinishedSync): Promise<void> {
    const index = this.syncs.findIndex((sync) => sync.id === syncId);
    const sync = this.syncs[index];
    if (!sync) return Promise.reject(new Error(`unknown sync ${syncId}`));
    this.syncs[index] = { ...sync, ...result };
    return Promise.resolve();
  }
}
