import { describe, expect, it } from 'vitest';

import page from '../test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import {
  CATALOG_PARTITIONS,
  CatalogFetchError,
  MAX_PARTITION_PASSES,
  fetchFutggCatalog,
} from './catalog-fetch.js';
import type { OverallRange } from './catalog-fetch.js';
import { FUTGG_QUERY_RESULT_CAP } from './futgg.js';
import type { FetchFn } from './http.js';

type RawItem = (typeof page)['data'][number];
const templates: readonly RawItem[] = page.data;

/** Real FUT.GG items, copied with distinct ids and an overall inside the range. */
function itemsIn(range: OverallRange, count: number, firstId: number): RawItem[] {
  return Array.from({ length: count }, (_, index) => {
    const template = templates[index % templates.length];
    if (!template) throw new Error('no templates');
    return { ...template, eaId: firstId + index, overall: range.min };
  });
}

const PAGE_SIZE = 30;

interface FakeFutgg {
  readonly fetch: FetchFn;
  readonly requests: string[];
}

/**
 * Serves the definitions endpoint like FUT.GG: 30 items per page, filtered by
 * overall range. Requests listed in `unstable` return the page with its last
 * item replaced by a duplicate of its first, as unstable ordering does.
 */
function fakeFutgg(
  dataset: ReadonlyMap<string, RawItem[]>,
  options: { unstable?: (url: string, attempt: number) => boolean; total?: number } = {},
): FakeFutgg {
  const requests: string[] = [];
  const attempts = new Map<string, number>();
  const fetch: FetchFn = (url) => {
    requests.push(url);
    const params = new URL(url).searchParams;
    const key = `${params.get('overall__gte')}-${params.get('overall__lte')}`;
    const items = dataset.get(key);
    if (!items) return Promise.resolve(new Response('unknown range', { status: 400 }));
    const pageNumber = Number(params.get('page'));
    const attempt = (attempts.get(url) ?? 0) + 1;
    attempts.set(url, attempt);
    let data = items.slice((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE);
    const first = data[0];
    if (options.unstable?.(url, attempt) === true && first) {
      data = [...data.slice(0, -1), first];
    }
    const last = pageNumber * PAGE_SIZE >= items.length;
    return Promise.resolve(
      Response.json({
        data,
        next: last ? null : pageNumber + 1,
        currentPage: pageNumber,
        total: options.total ?? items.length,
      }),
    );
  };
  return { fetch, requests };
}

const LOW: OverallRange = { min: 0, max: 59 };
const HIGH: OverallRange = { min: 60, max: 99 };
const dataset = new Map([
  ['0-59', itemsIn(LOW, 35, 1000)],
  ['60-99', itemsIn(HIGH, 3, 2000)],
]);

const url = (range: OverallRange, pageNumber: number) =>
  `https://www.fut.gg/api/fut/players/v2/27/definitions/?page=${pageNumber}&overall__gte=${range.min}&overall__lte=${range.max}`;

function recordingSleep(): { sleep: (ms: number) => Promise<void>; waits: number[] } {
  const waits: number[] = [];
  return {
    waits,
    sleep: (ms) => {
      waits.push(ms);
      return Promise.resolve();
    },
  };
}

describe('fetchFutggCatalog', () => {
  it('reads every page of every partition, pausing between requests', async () => {
    const futgg = fakeFutgg(dataset);
    const { sleep, waits } = recordingSleep();

    const cards = await fetchFutggCatalog({
      fetch: futgg.fetch,
      sleep,
      delayMs: 1000,
      partitions: [LOW, HIGH],
    });

    expect(futgg.requests).toEqual([url(LOW, 1), url(LOW, 2), url(HIGH, 1)]);
    expect(waits).toEqual([1000, 1000]);
    expect(cards.map((card) => card.eaId)).toEqual([
      ...Array.from({ length: 35 }, (_, index) => 1000 + index),
      2000,
      2001,
      2002,
    ]);
    expect(cards[0]?.source).toBe('futgg');
  });

  it('re-reads a partition that came back incomplete and merges the passes', async () => {
    const futgg = fakeFutgg(dataset, {
      unstable: (requested, attempt) => requested === url(LOW, 1) && attempt === 1,
    });

    const cards = await fetchFutggCatalog({
      fetch: futgg.fetch,
      sleep: recordingSleep().sleep,
      delayMs: 0,
      partitions: [LOW, HIGH],
    });

    expect(futgg.requests).toEqual([
      url(LOW, 1),
      url(LOW, 2),
      url(LOW, 1),
      url(LOW, 2),
      url(HIGH, 1),
    ]);
    expect(new Set(cards.map((card) => card.eaId)).size).toBe(38);
    expect(cards).toHaveLength(38);
  });

  it('fails when a partition stays incomplete after the maximum number of passes', async () => {
    const futgg = fakeFutgg(dataset, { unstable: (requested) => requested === url(LOW, 2) });

    const result = fetchFutggCatalog({
      fetch: futgg.fetch,
      sleep: recordingSleep().sleep,
      delayMs: 0,
      partitions: [LOW, HIGH],
    });

    await expect(result).rejects.toBeInstanceOf(CatalogFetchError);
    await expect(result).rejects.toMatchObject({
      name: 'CatalogFetchError',
      message: '[futgg] partition 0-59: collected 34 of 35 cards after 3 passes',
    });
    expect(futgg.requests.filter((requested) => requested === url(LOW, 1))).toHaveLength(
      MAX_PARTITION_PASSES,
    );
    expect(futgg.requests).not.toContain(url(HIGH, 1));
  });

  it('fails when a partition reaches the query cap, which would hide cards', async () => {
    const futgg = fakeFutgg(dataset, { total: FUTGG_QUERY_RESULT_CAP });

    await expect(
      fetchFutggCatalog({
        fetch: futgg.fetch,
        sleep: recordingSleep().sleep,
        delayMs: 0,
        partitions: [LOW],
      }),
    ).rejects.toThrow('[futgg] partition 0-59 reports 10000 cards, at the FUT.GG query cap');
    expect(futgg.requests).toEqual([url(LOW, 1)]);
  });

  it('propagates a source error', async () => {
    await expect(
      fetchFutggCatalog({
        fetch: () => Promise.resolve(new Response('Forbidden', { status: 403 })),
        sleep: recordingSleep().sleep,
        delayMs: 0,
        partitions: [LOW],
      }),
    ).rejects.toThrow('[futgg] HTTP 403');
  });
});

describe('CATALOG_PARTITIONS', () => {
  it('covers every overall rating from 0 to 99 exactly once, in ascending order', () => {
    const covered = CATALOG_PARTITIONS.flatMap(({ min, max }) =>
      Array.from({ length: max - min + 1 }, (_, index) => min + index),
    );
    expect(covered).toEqual(Array.from({ length: 100 }, (_, index) => index));
  });
});
