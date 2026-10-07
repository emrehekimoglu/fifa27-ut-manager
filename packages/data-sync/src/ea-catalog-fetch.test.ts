import { describe, expect, it } from 'vitest';

import eaPage from '../test/fixtures/ea-ratings-page.json' with { type: 'json' };
import { fetchEaCatalog } from './catalog-fetch.js';
import type { FetchFn } from './http.js';

type RawItem = (typeof eaPage)['items'][number];

/** Serves EA's ratings API for a catalog of `size` real items with distinct ids. */
function fakeEa(size: number): { fetch: FetchFn; requests: string[] } {
  const items: RawItem[] = Array.from({ length: size }, (_, index) => {
    const template = eaPage.items[index % eaPage.items.length];
    if (!template) throw new Error('no templates');
    return { ...template, id: 5000 + index };
  });
  const requests: string[] = [];
  const fetch: FetchFn = (url) => {
    requests.push(url);
    const params = new URL(url).searchParams;
    const offset = Number(params.get('offset'));
    const limit = Number(params.get('limit'));
    return Promise.resolve(
      Response.json({ items: items.slice(offset, offset + limit), totalItems: size }),
    );
  };
  return { fetch, requests };
}

const url = (offset: number) =>
  `https://drop-api.ea.com/rating/ea-sports-fc?locale=en&limit=2&offset=${offset}&cb=run-7`;

describe('fetchEaCatalog', () => {
  it('reads pages until every reported item is fetched, pausing between requests', async () => {
    const ea = fakeEa(5);
    const waits: number[] = [];

    const cards = await fetchEaCatalog({
      fetch: ea.fetch,
      sleep: (ms) => {
        waits.push(ms);
        return Promise.resolve();
      },
      delayMs: 500,
      pageSize: 2,
      cacheBust: 'run-7',
    });

    expect(ea.requests).toEqual([url(0), url(2), url(4)]);
    expect(waits).toEqual([500, 500]);
    expect(cards.map((card) => card.eaId)).toEqual([5000, 5001, 5002, 5003, 5004]);
    expect(cards.every((card) => card.source === 'ea')).toBe(true);
  });

  it('stops after a single page when it holds the whole catalog', async () => {
    const ea = fakeEa(2);

    const cards = await fetchEaCatalog({
      fetch: ea.fetch,
      sleep: () => Promise.resolve(),
      delayMs: 0,
      pageSize: 2,
      cacheBust: 'run-7',
    });

    expect(ea.requests).toEqual([url(0)]);
    expect(cards).toHaveLength(2);
  });

  it('fails when EA returns fewer items than it reports', async () => {
    const short: FetchFn = () => Promise.resolve(Response.json({ items: [], totalItems: 19789 }));

    await expect(
      fetchEaCatalog({
        fetch: short,
        sleep: () => Promise.resolve(),
        delayMs: 0,
        pageSize: 100,
        cacheBust: 'run-7',
      }),
    ).rejects.toThrow('[ea] page at offset 0 is empty, but 19789 cards were reported');
  });
});
