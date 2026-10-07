import { describe, expect, it } from 'vitest';

import { POSITIONS } from './catalog-card.js';
import { fetchEaRatingsPage } from './ea.js';
import { fetchFutggDefinitionsPage } from './futgg.js';

// Live contract tests: they call the real sources and fail when a response no longer
// matches the schemas the adapters rely on. Run on a schedule, not as a PR gate.

describe('FUT.GG definitions endpoint', () => {
  it('serves a full first page that matches the adapter schema', async () => {
    const page = await fetchFutggDefinitionsPage(1, fetch);

    expect(page.currentPage).toBe(1);
    expect(page.nextPage).toBe(2);
    expect(page.cards).toHaveLength(30);
    expect(page.total).toBe(10000);
    for (const card of page.cards) {
      expect(POSITIONS).toContain(card.position);
      expect(card.imageUrl).toMatch(/^https:\/\/game-assets\.fut\.gg\/.+\.webp$/);
    }
  });
});

describe('EA ratings endpoint', () => {
  it('serves FC 27 base cards that match the adapter schema', async () => {
    const page = await fetchEaRatingsPage(
      { offset: 0, limit: 100, cacheBust: String(Date.now()) },
      fetch,
    );

    expect(page.cards).toHaveLength(100);
    // FC 26 had 17,873 base cards; FC 27 launched with 19,789. A smaller total means
    // the referrer header no longer selects FC 27.
    expect(page.totalItems).toBeGreaterThanOrEqual(19_000);
  });
});
