import { describe, expect, it } from 'vitest';

import eaPage from '../test/fixtures/ea-ratings-page.json' with { type: 'json' };
import futggPage from '../test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { InMemoryCatalogStore } from '../test/in-memory-catalog-store.js';
import type { CatalogCard } from './catalog-card.js';
import { runCatalogSync } from './catalog-sync.js';
import { parseEaRatingsPage } from './ea.js';
import { parseFutggDefinitionsPage } from './futgg.js';

const futggCards = parseFutggDefinitionsPage(futggPage).cards;
const eaCards = parseEaRatingsPage(eaPage).cards;

/**
 * A catalog of the given size built from real cards: copies of the fixture cards
 * with distinct ids, because a valid catalog needs at least 15,000 cards.
 */
function catalogOf(size: number, from: readonly CatalogCard[] = futggCards): CatalogCard[] {
  return Array.from({ length: size }, (_, index) => {
    const template = from[index % from.length];
    if (!template) throw new Error('empty template list');
    return { ...template, eaId: 1_000_000 + index };
  });
}

const T0 = Date.UTC(2026, 9, 7, 4, 0, 0);
const clock = () => {
  let tick = 0;
  return () => T0 + 1000 * tick++;
};
const iso = (seconds: number) => new Date(T0 + seconds * 1000).toISOString();

const failing = (message: string) => () => Promise.reject(new Error(message));

describe('runCatalogSync', () => {
  it('writes a valid FUT.GG catalog and records the successful sync', async () => {
    const store = new InMemoryCatalogStore();
    const catalog = catalogOf(19958);

    const result = await runCatalogSync({
      store,
      fetchPrimary: () => Promise.resolve(catalog),
      fetchFallback: failing('fallback must not be used'),
      now: clock(),
    });

    expect(result).toEqual({
      syncId: 1,
      status: 'succeeded',
      source: 'futgg',
      cardCount: 19958,
      deactivatedCount: 0,
      error: null,
    });
    expect(store.cards.size).toBe(19958);
    expect(store.syncs).toEqual([
      {
        id: 1,
        startedAt: iso(0),
        finishedAt: iso(1),
        status: 'succeeded',
        source: 'futgg',
        cardCount: 19958,
        deactivatedCount: 0,
        error: null,
      },
    ]);
  });

  it('deactivates cards that disappeared from the source since the last sync', async () => {
    const store = new InMemoryCatalogStore();
    const now = clock();
    const catalog = catalogOf(19958);
    await runCatalogSync({
      store,
      fetchPrimary: () => Promise.resolve(catalog),
      fetchFallback: failing('unused'),
      now,
    });

    const result = await runCatalogSync({
      store,
      fetchPrimary: () => Promise.resolve(catalog.slice(0, 19900)),
      fetchFallback: failing('unused'),
      now,
    });

    expect(result).toMatchObject({ status: 'succeeded', cardCount: 19900, deactivatedCount: 58 });
    const inactive = [...store.cards.values()].filter((stored) => !stored.isActive);
    expect(inactive.map((stored) => stored.card.eaId)).toEqual(
      catalog.slice(19900).map((card) => card.eaId),
    );
  });

  it('keeps the last good catalog when FUT.GG fails after a previous success', async () => {
    const store = new InMemoryCatalogStore();
    const now = clock();
    await runCatalogSync({
      store,
      fetchPrimary: () => Promise.resolve(catalogOf(19958)),
      fetchFallback: failing('unused'),
      now,
    });
    let fallbackUsed = false;

    const result = await runCatalogSync({
      store,
      fetchPrimary: failing('[futgg] HTTP 503'),
      fetchFallback: () => {
        fallbackUsed = true;
        return Promise.resolve(catalogOf(19789, eaCards));
      },
      now,
    });

    expect(result).toEqual({
      syncId: 2,
      status: 'failed',
      source: null,
      cardCount: null,
      deactivatedCount: null,
      error: '[futgg] HTTP 503',
    });
    expect(fallbackUsed).toBe(false);
    expect(store.cards.size).toBe(19958);
    expect([...store.cards.values()].every((stored) => stored.card.source === 'futgg')).toBe(true);
  });

  it('keeps the last good catalog when FUT.GG returns too few cards', async () => {
    const store = new InMemoryCatalogStore();
    const now = clock();
    await runCatalogSync({
      store,
      fetchPrimary: () => Promise.resolve(catalogOf(20000)),
      fetchFallback: failing('unused'),
      now,
    });

    const result = await runCatalogSync({
      store,
      fetchPrimary: () => Promise.resolve(catalogOf(18000)),
      fetchFallback: failing('unused'),
      now,
    });

    expect(result).toMatchObject({
      status: 'failed',
      error: 'catalog has 18000 cards, more than 5 % fewer than the previous 20000',
    });
    expect([...store.cards.values()].filter((stored) => stored.isActive)).toHaveLength(20000);
  });

  it('bootstraps an empty catalog from EA when FUT.GG fails, keeping the FUT.GG error', async () => {
    const store = new InMemoryCatalogStore();

    const result = await runCatalogSync({
      store,
      fetchPrimary: failing('[futgg] HTTP 403'),
      fetchFallback: () => Promise.resolve(catalogOf(19789, eaCards)),
      now: clock(),
    });

    expect(result).toEqual({
      syncId: 1,
      status: 'succeeded',
      source: 'ea',
      cardCount: 19789,
      deactivatedCount: 0,
      error: '[futgg] HTTP 403',
    });
    expect(store.syncs[0]?.error).toBe('[futgg] HTTP 403');
    expect([...store.cards.values()].every((stored) => stored.card.source === 'ea')).toBe(true);
  });

  it('records both errors when the empty catalog cannot be bootstrapped at all', async () => {
    const store = new InMemoryCatalogStore();

    const result = await runCatalogSync({
      store,
      fetchPrimary: failing('[futgg] HTTP 403'),
      fetchFallback: failing('[ea] HTTP 502'),
      now: clock(),
    });

    expect(result).toEqual({
      syncId: 1,
      status: 'failed',
      source: null,
      cardCount: null,
      deactivatedCount: null,
      error: '[futgg] HTTP 403; fallback: [ea] HTTP 502',
    });
    expect(store.cards.size).toBe(0);
    expect(store.syncs[0]).toMatchObject({ status: 'failed', finishedAt: iso(1) });
  });

  it('rejects a fallback catalog that is too small', async () => {
    const store = new InMemoryCatalogStore();

    const result = await runCatalogSync({
      store,
      fetchPrimary: failing('[futgg] HTTP 403'),
      fetchFallback: () => Promise.resolve(catalogOf(1200, eaCards)),
      now: clock(),
    });

    expect(result.error).toBe(
      '[futgg] HTTP 403; fallback: catalog has 1200 cards, fewer than the minimum of 15000',
    );
    expect(store.cards.size).toBe(0);
  });
});
