import type { CardSource, CatalogCard } from './catalog-card.js';

export type SyncStatus = 'running' | 'succeeded' | 'failed';

export interface FinishedSync {
  readonly finishedAt: string;
  readonly status: Exclude<SyncStatus, 'running'>;
  /** The source the catalog was written from; null when nothing was written. */
  readonly source: CardSource | null;
  readonly cardCount: number | null;
  readonly deactivatedCount: number | null;
  /** Why the sync failed, or, after a bootstrap from EA, why FUT.GG could not be used. */
  readonly error: string | null;
}

export type SyncRecord = Partial<Omit<FinishedSync, 'status'>> & {
  readonly id: number;
  readonly startedAt: string;
  readonly status: SyncStatus;
};

/** Persistence used by the catalog sync; implemented for Supabase and, in tests, in memory. */
export interface CatalogStore {
  /** Card count of the most recent successful sync, or null when there has been none. */
  lastSuccessfulCardCount(): Promise<number | null>;
  startSync(startedAt: string): Promise<number>;
  /** Inserts or updates the cards, marking them active and seen by this sync. */
  upsertCards(syncId: number, cards: readonly CatalogCard[]): Promise<void>;
  /** Marks active cards not seen by this sync as inactive; returns how many changed. */
  deactivateCardsNotSeen(syncId: number): Promise<number>;
  finishSync(syncId: number, result: FinishedSync): Promise<void>;
}
