import { describe, expect, it } from 'vitest';

import eaPage from '../test/fixtures/ea-ratings-page.json' with { type: 'json' };
import futggPage from '../test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { checkSourceHealth } from './health.js';
import type { FetchFn } from './http.js';

/** A clock that returns the given timestamps in order. */
function clock(...timestamps: number[]): () => number {
  let index = 0;
  return () => {
    const value = timestamps[Math.min(index, timestamps.length - 1)];
    index += 1;
    if (value === undefined) throw new Error('clock without timestamps');
    return value;
  };
}

const START = Date.UTC(2026, 9, 7, 19, 0, 0);

function respondWith(body: unknown, requested: string[] = []): FetchFn {
  return (url) => {
    requested.push(url);
    return Promise.resolve(Response.json(body));
  };
}

describe('checkSourceHealth', () => {
  it('reports a healthy FUT.GG source with its capped total and a sample of cards', async () => {
    const requested: string[] = [];
    const health = await checkSourceHealth('futgg', {
      fetch: respondWith(futggPage, requested),
      now: clock(START, START + 412),
      sampleSize: 2,
    });

    expect(requested).toEqual(['https://www.fut.gg/api/fut/players/v2/27/definitions/?page=1']);
    expect(health).toMatchObject({
      source: 'futgg',
      status: 'ok',
      checkedAt: '2026-10-07T19:00:00.000Z',
      latencyMs: 412,
      totalCards: 10000,
      totalIsCapped: true,
      error: null,
    });
    expect(health.sample.map((card) => card.name)).toEqual(['Pelé', 'Takefusa Kubo']);
  });

  it('does not flag a FUT.GG total below the query cap as capped', async () => {
    const health = await checkSourceHealth('futgg', {
      fetch: respondWith({ ...futggPage, total: 9999 }),
      now: clock(START, START + 10),
      sampleSize: 1,
    });

    expect(health.totalCards).toBe(9999);
    expect(health.totalIsCapped).toBe(false);
  });

  it('reports a healthy EA source with its real total', async () => {
    const requested: string[] = [];
    const health = await checkSourceHealth('ea', {
      fetch: respondWith(eaPage, requested),
      now: clock(START, START + 95),
      sampleSize: 3,
    });

    expect(requested).toEqual([
      `https://drop-api.ea.com/rating/ea-sports-fc?locale=en&limit=3&offset=0&cb=${START}`,
    ]);
    expect(health).toMatchObject({
      source: 'ea',
      status: 'ok',
      latencyMs: 95,
      totalCards: 19789,
      totalIsCapped: false,
      error: null,
    });
    expect(health.sample.map((card) => card.name)).toEqual([
      'Kylian Mbappé',
      'Thibaut Courtois',
      'Erling Haaland',
    ]);
  });

  it('reports an HTTP failure as an error with the measured latency', async () => {
    const health = await checkSourceHealth('futgg', {
      fetch: () => Promise.resolve(new Response('Forbidden', { status: 403 })),
      now: clock(START, START + 230),
      sampleSize: 3,
    });

    expect(health).toEqual({
      source: 'futgg',
      status: 'error',
      checkedAt: '2026-10-07T19:00:00.000Z',
      latencyMs: 230,
      totalCards: null,
      totalIsCapped: false,
      sample: [],
      error: '[futgg] HTTP 403',
    });
  });

  it('reports a schema change as an error', async () => {
    const health = await checkSourceHealth('ea', {
      fetch: respondWith({ results: [] }),
      now: clock(START, START + 50),
      sampleSize: 3,
    });

    expect(health.status).toBe('error');
    expect(health.error).toMatch(/^\[ea\] invalid response: /);
    expect(health.sample).toEqual([]);
  });

  it('reports a network failure as an error', async () => {
    const health = await checkSourceHealth('ea', {
      fetch: () => Promise.reject(new TypeError('fetch failed')),
      now: clock(START, START + 3000),
      sampleSize: 3,
    });

    expect(health.status).toBe('error');
    expect(health.error).toBe('fetch failed');
    expect(health.latencyMs).toBe(3000);
  });
});
