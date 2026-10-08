import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import futggPage from '../../../../../packages/data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { parseFutggDefinitionsPage } from '@fc27/data-sync';
import type { CatalogCard } from '@fc27/data-sync';
import { CATALOG_PAGE_SIZE, fetchCard, searchCatalog } from './catalog-query';

const SUPABASE_URL = 'https://project.supabase.co';
const [pele, kubo] = parseFutggDefinitionsPage(futggPage).cards as [CatalogCard, CatalogCard];

interface Captured {
  readonly path: string;
  readonly params: Record<string, string>;
}

/** A Supabase client that records each request and answers it with `respond`. */
function clientAnswering(respond: () => Response): {
  client: SupabaseClient;
  requests: Captured[];
} {
  const requests: Captured[] = [];
  const client = createClient(SUPABASE_URL, 'sb_publishable_test', {
    auth: { persistSession: false },
    global: {
      fetch: (input: RequestInfo | URL) => {
        const url = new URL(input instanceof Request ? input.url : String(input));
        requests.push({ path: url.pathname, params: Object.fromEntries(url.searchParams) });
        return Promise.resolve(respond());
      },
    },
  });
  return { client, requests };
}

const cardRows = (cards: readonly CatalogCard[], total: number) => () =>
  Response.json(
    cards.map((data) => ({ data })),
    {
      headers: {
        'content-range': `${cards.length > 0 ? `0-${cards.length - 1}` : '*'}/${total}`,
      },
    },
  );

const ACTIVE_BEST_FIRST = {
  select: 'data',
  is_active: 'eq.true',
  order: 'overall.desc,ea_id.asc',
};

describe('searchCatalog', () => {
  it('lists the first page of active cards, best first, with the total', async () => {
    const { client, requests } = clientAnswering(cardRows([pele, kubo], 19958));

    expect(await searchCatalog(client, { query: '', position: null, page: 1 })).toEqual({
      cards: [pele, kubo],
      total: 19958,
    });
    expect(CATALOG_PAGE_SIZE).toBe(30);
    expect(requests).toEqual([
      {
        path: '/rest/v1/cards',
        params: { ...ACTIVE_BEST_FIRST, offset: '0', limit: '30' },
      },
    ]);
  });

  it('matches names ignoring case and accents', async () => {
    const { client, requests } = clientAnswering(cardRows([], 0));

    await searchCatalog(client, { query: '  MBAPPÉ ', position: null, page: 1 });

    expect(requests[0]?.params).toEqual({
      ...ACTIVE_BEST_FIRST,
      search_name: 'ilike.%mbappe%',
      offset: '0',
      limit: '30',
    });
  });

  it('treats LIKE wildcards in the query as plain characters', async () => {
    const { client, requests } = clientAnswering(cardRows([], 0));

    await searchCatalog(client, { query: '50%_\\', position: null, page: 1 });

    expect(requests[0]?.params['search_name']).toBe('ilike.%50\\%\\_\\\\%');
  });

  it('keeps cards that can play the position as primary or alternate', async () => {
    const { client, requests } = clientAnswering(cardRows([], 0));

    await searchCatalog(client, { query: '', position: 'CB', page: 1 });

    expect(requests[0]?.params).toEqual({
      ...ACTIVE_BEST_FIRST,
      or: '(position.eq.CB,alternate_positions.cs.{CB})',
      offset: '0',
      limit: '30',
    });
  });

  it('skips the cards of earlier pages', async () => {
    const { client, requests } = clientAnswering(cardRows([], 19958));

    await searchCatalog(client, { query: '', position: null, page: 3 });

    expect(requests[0]?.params).toMatchObject({ offset: '60', limit: '30' });
  });

  it('fails with the database error message', async () => {
    const { client } = clientAnswering(() =>
      Response.json({ message: 'permission denied for table cards' }, { status: 401 }),
    );

    await expect(searchCatalog(client, { query: '', position: null, page: 1 })).rejects.toThrow(
      'permission denied for table cards',
    );
  });
});

describe('fetchCard', () => {
  it('reads one card by its EA id, with whether it is still active', async () => {
    const { client, requests } = clientAnswering(() =>
      Response.json([{ data: pele, is_active: true }]),
    );

    expect(await fetchCard(client, 237067)).toEqual({ card: pele, isActive: true });
    expect(requests).toEqual([
      {
        path: '/rest/v1/cards',
        params: { select: 'data,is_active', ea_id: 'eq.237067', limit: '1' },
      },
    ]);
  });

  it('reports a card the source no longer lists as inactive', async () => {
    const { client } = clientAnswering(() => Response.json([{ data: kubo, is_active: false }]));

    expect(await fetchCard(client, kubo.eaId)).toEqual({ card: kubo, isActive: false });
  });

  it('returns null for an unknown card', async () => {
    const { client } = clientAnswering(() => Response.json([]));

    expect(await fetchCard(client, 1)).toBeNull();
  });

  it('fails with the database error message', async () => {
    const { client } = clientAnswering(() =>
      Response.json({ message: 'permission denied for table cards' }, { status: 401 }),
    );

    await expect(fetchCard(client, 1)).rejects.toThrow('permission denied for table cards');
  });
});
