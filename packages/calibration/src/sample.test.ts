import { describe, expect, it } from 'vitest';

import type { FetchFn } from '@fc27/data-sync';
import { collectMetarank, pickSample } from './sample.js';

describe('pickSample', () => {
  it('spreads each group’s pick evenly over its cards sorted by overall', () => {
    // Six strikers by overall 60, 70, 70, 80, 85, 90 (ties by EA id); three picks take
    // positions 0, 2 and 4 of six.
    const strikers = [
      { eaId: 6, overall: 90, position: 'ST' as const },
      { eaId: 2, overall: 70, position: 'ST' as const },
      { eaId: 1, overall: 70, position: 'ST' as const },
      { eaId: 4, overall: 85, position: 'ST' as const },
      { eaId: 5, overall: 60, position: 'ST' as const },
      { eaId: 3, overall: 80, position: 'ST' as const },
    ];
    expect(pickSample(strikers, 3).map((card) => card.eaId)).toEqual([5, 2, 4]);
  });

  it('groups mirrored positions and takes every card of a small group', () => {
    const cards = [
      { eaId: 10, overall: 80, position: 'RB' as const },
      { eaId: 11, overall: 75, position: 'LB' as const },
      { eaId: 12, overall: 70, position: 'GK' as const },
    ];
    // Groups in alphabetical order: FB (RB and LB), then GK.
    expect(pickSample(cards, 5).map((card) => card.eaId)).toEqual([11, 10, 12]);
  });

  it('takes 80 cards of a group by default', () => {
    const cards = Array.from({ length: 200 }, (_, index) => ({
      eaId: index,
      overall: 50 + (index % 40),
      position: 'CM' as const,
    }));
    expect(pickSample(cards)).toHaveLength(80);
  });
});

describe('collectMetarank', () => {
  const ok = { data: { scores: [{ role: 63, chemistryStyle: 1, score: 80 }] } };

  it('fetches each card in turn, pausing before each but the first', async () => {
    const events: string[] = [];
    const progress: string[] = [];
    const fetch: FetchFn = (url) => {
      events.push(`get ${url.split('/').at(-2) ?? ''}`);
      const status = url.includes('/2/') ? 404 : 200;
      return Promise.resolve(new Response(JSON.stringify(ok), { status }));
    };
    const collected = await collectMetarank([1, 2, 3], {
      fetch,
      sleep: (milliseconds) => {
        events.push(`sleep ${milliseconds}`);
        return Promise.resolve();
      },
      delayMs: 2000,
      onProgress: (done, total) => progress.push(`${done}/${total}`),
    });
    expect(events).toEqual(['get 1', 'sleep 2000', 'get 2', 'sleep 2000', 'get 3']);
    expect(progress).toEqual(['1/3', '2/3', '3/3']);
    expect(collected).toEqual({
      1: [{ role: 63, chemistryStyle: 1, score: 80 }],
      2: null,
      3: [{ role: 63, chemistryStyle: 1, score: 80 }],
    });
  });

  it('stops at the first refusal', async () => {
    const requested: string[] = [];
    const fetch: FetchFn = (url) => {
      requested.push(url);
      return Promise.resolve(new Response('{}', { status: 403 }));
    };
    await expect(
      collectMetarank([1, 2], { fetch, sleep: () => Promise.resolve(), delayMs: 0 }),
    ).rejects.toThrow('HTTP 403');
    expect(requested).toHaveLength(1);
  });
});
