import { describe, expect, it } from 'vitest';

import { SourceHttpError } from '@fc27/data-sync';
import type { FetchFn } from '@fc27/data-sync';
import { fetchMetarank, METARANK_ROLE_POSITIONS, parseMetarank } from './metarank.js';

const body = {
  data: {
    eaId: 237067,
    scores: [
      { role: 66, chemistryStyle: 1, score: 94.23, rank: null, isPlus: false, isPlusPlus: true },
      { role: 37, chemistryStyle: 2, score: 94.18, rank: null, isPlus: true, isPlusPlus: false },
    ],
  },
};

const respond =
  (status: number, json: unknown, urls: string[] = []): FetchFn =>
  (url) => {
    urls.push(url);
    return Promise.resolve(new Response(JSON.stringify(json), { status }));
  };

describe('parseMetarank', () => {
  it('keeps the role, chemistry style and score of each rating', () => {
    expect(parseMetarank(body)).toEqual([
      { role: 66, chemistryStyle: 1, score: 94.23 },
      { role: 37, chemistryStyle: 2, score: 94.18 },
    ]);
  });

  it('refuses a body of another shape', () => {
    expect(() => parseMetarank({ data: { scores: [{ role: 'ST' }] } })).toThrow();
  });
});

describe('fetchMetarank', () => {
  it('reads the card’s meta ratings', async () => {
    const urls: string[] = [];
    expect(await fetchMetarank(237067, respond(200, body, urls))).toHaveLength(2);
    expect(urls).toEqual(['https://www.fut.gg/api/fut/metarank/player/237067/']);
  });

  it('is null when FUT.GG has no meta ratings for the card', async () => {
    expect(await fetchMetarank(1, respond(404, { detail: 'Not found.' }))).toBeNull();
  });

  it('stops on a refusal', async () => {
    await expect(fetchMetarank(1, respond(403, {}))).rejects.toBeInstanceOf(SourceHttpError);
  });
});

describe('METARANK_ROLE_POSITIONS', () => {
  it('maps base Pelé’s scored roles to the two positions he plays', () => {
    // FUT.GG scores base Pelé (CAM, alternate ST) in roles 37–40 and 63–66, and no others.
    expect([37, 38, 39, 40].map((role) => METARANK_ROLE_POSITIONS[role])).toEqual([
      'CAM',
      'CAM',
      'CAM',
      'CAM',
    ]);
    expect([63, 64, 65, 66].map((role) => METARANK_ROLE_POSITIONS[role])).toEqual([
      'ST',
      'ST',
      'ST',
      'ST',
    ]);
  });

  it('covers every position', () => {
    expect(new Set(Object.values(METARANK_ROLE_POSITIONS)).size).toBe(12);
  });
});
