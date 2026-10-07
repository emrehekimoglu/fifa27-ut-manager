import { beforeEach, describe, expect, it } from 'vitest';

import type { CatalogCard } from '../src/catalog-card.js';
import type { CatalogStore, SyncRecord } from '../src/catalog-store.js';
import { parseFutggDefinitionsPage } from '../src/futgg.js';
import heroPage from './fixtures/futgg-definitions-hero-page.json' with { type: 'json' };
import page from './fixtures/futgg-definitions-page.json' with { type: 'json' };

/** Read access to a store's state, so the same assertions run against every implementation. */
export interface StoreUnderTest {
  readonly store: CatalogStore;
  card(eaId: number): Promise<CatalogCard | null>;
  activeCardIds(): Promise<number[]>;
  inactiveCardIds(): Promise<number[]>;
  sync(id: number): Promise<SyncRecord>;
}

const [pele, kubo, courtois, donnarumma] = parseFutggDefinitionsPage(page).cards as [
  CatalogCard,
  CatalogCard,
  CatalogCard,
  CatalogCard,
];
const [kohler] = parseFutggDefinitionsPage(heroPage).cards as [CatalogCard];

const STARTED = '2026-10-07T04:00:00.000Z';
const FINISHED = '2026-10-07T04:12:30.000Z';

/** The behaviour every CatalogStore implementation must have. */
export function describeCatalogStoreContract(
  name: string,
  createStore: () => Promise<StoreUnderTest>,
): void {
  describe(`${name} (CatalogStore contract)`, () => {
    let subject: StoreUnderTest;

    beforeEach(async () => {
      subject = await createStore();
    });

    it('reports no successful sync on an empty store', async () => {
      expect(await subject.store.lastSuccessfulCardCount()).toBeNull();
    });

    it('records a started sync as running', async () => {
      const id = await subject.store.startSync(STARTED);
      expect(await subject.sync(id)).toMatchObject({ id, startedAt: STARTED, status: 'running' });
    });

    it('gives each sync its own increasing id', async () => {
      const first = await subject.store.startSync(STARTED);
      const second = await subject.store.startSync(STARTED);
      expect(second).toBeGreaterThan(first);
    });

    it('stores every field of a card without loss', async () => {
      const id = await subject.store.startSync(STARTED);
      await subject.store.upsertCards(id, [pele, courtois]);

      expect(await subject.card(pele.eaId)).toEqual(pele);
      expect(await subject.card(courtois.eaId)).toEqual(courtois);
      expect(await subject.activeCardIds()).toEqual([courtois.eaId, pele.eaId]);
    });

    it('stores a card without a club, such as a hero, without loss', async () => {
      const id = await subject.store.startSync(STARTED);
      await subject.store.upsertCards(id, [kohler]);

      expect(kohler.club).toBeNull();
      expect(await subject.card(kohler.eaId)).toEqual(kohler);
    });

    it('overwrites an existing card on upsert', async () => {
      const first = await subject.store.startSync(STARTED);
      await subject.store.upsertCards(first, [kubo]);
      const second = await subject.store.startSync(STARTED);
      const upgraded: CatalogCard = { ...kubo, overall: 84, isUntradeable: true };
      await subject.store.upsertCards(second, [upgraded]);

      expect(await subject.card(kubo.eaId)).toEqual(upgraded);
    });

    it('deactivates only the active cards the given sync did not see', async () => {
      const first = await subject.store.startSync(STARTED);
      await subject.store.upsertCards(first, [pele, kubo, courtois]);
      const second = await subject.store.startSync(STARTED);
      await subject.store.upsertCards(second, [pele, donnarumma]);

      expect(await subject.store.deactivateCardsNotSeen(second)).toBe(2);
      expect(await subject.activeCardIds()).toEqual(
        [pele.eaId, donnarumma.eaId].sort((a, b) => a - b),
      );
      expect(await subject.inactiveCardIds()).toEqual(
        [courtois.eaId, kubo.eaId].sort((a, b) => a - b),
      );
      expect(await subject.store.deactivateCardsNotSeen(second)).toBe(0);
    });

    it('reactivates a card when a later sync sees it again', async () => {
      const first = await subject.store.startSync(STARTED);
      await subject.store.upsertCards(first, [kubo]);
      const second = await subject.store.startSync(STARTED);
      await subject.store.deactivateCardsNotSeen(second);
      const third = await subject.store.startSync(STARTED);
      await subject.store.upsertCards(third, [kubo]);

      expect(await subject.activeCardIds()).toEqual([kubo.eaId]);
    });

    it('stores the result of a finished sync', async () => {
      const id = await subject.store.startSync(STARTED);
      await subject.store.finishSync(id, {
        finishedAt: FINISHED,
        status: 'failed',
        source: null,
        cardCount: null,
        deactivatedCount: null,
        error: '[futgg] HTTP 503',
      });

      expect(await subject.sync(id)).toEqual({
        id,
        startedAt: STARTED,
        finishedAt: FINISHED,
        status: 'failed',
        source: null,
        cardCount: null,
        deactivatedCount: null,
        error: '[futgg] HTTP 503',
      });
    });

    it('reports the card count of the latest successful sync, ignoring later failures', async () => {
      const finish = (id: number, status: 'succeeded' | 'failed', cardCount: number | null) =>
        subject.store.finishSync(id, {
          finishedAt: FINISHED,
          status,
          source: status === 'succeeded' ? 'futgg' : null,
          cardCount,
          deactivatedCount: status === 'succeeded' ? 0 : null,
          error: status === 'failed' ? 'boom' : null,
        });

      await finish(await subject.store.startSync(STARTED), 'succeeded', 19958);
      await finish(await subject.store.startSync(STARTED), 'succeeded', 20012);
      await finish(await subject.store.startSync(STARTED), 'failed', null);
      await subject.store.startSync(STARTED);

      expect(await subject.store.lastSuccessfulCardCount()).toBe(20012);
    });
  });
}
