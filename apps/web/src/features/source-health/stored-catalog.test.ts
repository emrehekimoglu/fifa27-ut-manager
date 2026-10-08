import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import futggPage from '../../../../../packages/data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { parseFutggDefinitionsPage } from '@fc27/data-sync';
import { fetchStoredFutggCatalog } from './stored-catalog';

const SUPABASE_URL = 'https://project.supabase.co';
const [pele, kubo, courtois] = parseFutggDefinitionsPage(futggPage).cards;

const LATEST_FINISHED = `${SUPABASE_URL}/rest/v1/catalog_syncs?select=status,source,error&status=in.(succeeded,failed)&order=id.desc&limit=1`;
const LAST_FUTGG_SUCCESS = `${SUPABASE_URL}/rest/v1/catalog_syncs?select=finished_at&status=eq.succeeded&source=eq.futgg&order=id.desc&limit=1`;
const ACTIVE_FUTGG_CARDS = `${SUPABASE_URL}/rest/v1/cards?select=data&source=eq.futgg&is_active=eq.true&order=overall.desc,ea_id.asc&limit=3`;

interface Answers {
  readonly latestFinished: unknown[];
  readonly lastFutggSuccess: unknown[];
  readonly cards: unknown[];
  readonly totalCards: number;
}

/** A Supabase client answering the three queries like PostgREST would. */
function clientAnswering(
  answers: Answers,
  failingUrl?: string,
): { client: SupabaseClient; requests: string[] } {
  const requests: string[] = [];
  const respond = (url: string): Response => {
    if (url === failingUrl) {
      return Response.json({ message: `permission denied for ${url}` }, { status: 401 });
    }
    if (url === LATEST_FINISHED) return Response.json(answers.latestFinished);
    if (url === LAST_FUTGG_SUCCESS) return Response.json(answers.lastFutggSuccess);
    if (url === ACTIVE_FUTGG_CARDS) {
      const range = answers.cards.length > 0 ? `0-${answers.cards.length - 1}` : '*';
      return Response.json(answers.cards, {
        headers: { 'content-range': `${range}/${answers.totalCards}` },
      });
    }
    return Response.json({ message: `unexpected request ${url}` }, { status: 400 });
  };
  const client = createClient(SUPABASE_URL, 'sb_publishable_test', {
    auth: { persistSession: false },
    global: {
      fetch: (input: RequestInfo | URL) => {
        const url = decodeURIComponent(input instanceof Request ? input.url : String(input));
        requests.push(url);
        return Promise.resolve(respond(url));
      },
    },
  });
  return { client, requests };
}

describe('fetchStoredFutggCatalog', () => {
  it('reports a working FUT.GG catalog with its size, last fetch and top cards', async () => {
    const { client, requests } = clientAnswering({
      latestFinished: [{ status: 'succeeded', source: 'futgg', error: null }],
      lastFutggSuccess: [{ finished_at: '2026-10-08T07:16:48.312+00:00' }],
      cards: [{ data: pele }, { data: courtois }, { data: kubo }],
      totalCards: 19958,
    });

    expect(await fetchStoredFutggCatalog(client, 3)).toEqual({
      status: 'ok',
      error: null,
      lastFetchedAt: '2026-10-08T07:16:48.312Z',
      activeCardCount: 19958,
      sample: [pele, courtois, kubo],
    });
    expect(requests.sort()).toEqual(
      [LAST_FUTGG_SUCCESS, LATEST_FINISHED, ACTIVE_FUTGG_CARDS].sort(),
    );
  });

  it('reports the error of a failed latest sync, keeping the last good fetch', async () => {
    const { client } = clientAnswering({
      latestFinished: [{ status: 'failed', source: null, error: '[futgg] HTTP 503' }],
      lastFutggSuccess: [{ finished_at: '2026-10-07T04:11:52+00:00' }],
      cards: [{ data: pele }],
      totalCards: 19958,
    });

    expect(await fetchStoredFutggCatalog(client, 3)).toEqual({
      status: 'error',
      error: '[futgg] HTTP 503',
      lastFetchedAt: '2026-10-07T04:11:52.000Z',
      activeCardCount: 19958,
      sample: [pele],
    });
  });

  it('reports an error when the latest sync fell back to EA, with FUT.GG’s error', async () => {
    const { client } = clientAnswering({
      latestFinished: [{ status: 'succeeded', source: 'ea', error: '[futgg] HTTP 403' }],
      lastFutggSuccess: [],
      cards: [],
      totalCards: 0,
    });

    expect(await fetchStoredFutggCatalog(client, 3)).toEqual({
      status: 'error',
      error: '[futgg] HTTP 403',
      lastFetchedAt: null,
      activeCardCount: 0,
      sample: [],
    });
  });

  it('explains an EA fallback that recorded no FUT.GG error', async () => {
    const { client } = clientAnswering({
      latestFinished: [{ status: 'succeeded', source: 'ea', error: null }],
      lastFutggSuccess: [],
      cards: [],
      totalCards: 0,
    });

    expect(await fetchStoredFutggCatalog(client, 3)).toMatchObject({
      status: 'error',
      error: 'Son senkronizasyon yedek kaynaktan (EA) yapıldı.',
    });
  });

  it('has no status before the first finished sync', async () => {
    const { client } = clientAnswering({
      latestFinished: [],
      lastFutggSuccess: [],
      cards: [],
      totalCards: 0,
    });

    expect(await fetchStoredFutggCatalog(client, 3)).toEqual({
      status: null,
      error: null,
      lastFetchedAt: null,
      activeCardCount: 0,
      sample: [],
    });
  });

  it.each([
    ['the latest sync', LATEST_FINISHED],
    ['the last FUT.GG success', LAST_FUTGG_SUCCESS],
    ['the stored cards', ACTIVE_FUTGG_CARDS],
  ])('fails with the database error when reading %s fails', async (_, failingUrl) => {
    const answers: Answers = {
      latestFinished: [{ status: 'succeeded', source: 'futgg', error: null }],
      lastFutggSuccess: [{ finished_at: '2026-10-08T07:16:48+00:00' }],
      cards: [{ data: pele }],
      totalCards: 19958,
    };
    const { client } = clientAnswering(answers, failingUrl);

    await expect(fetchStoredFutggCatalog(client, 3)).rejects.toThrow(
      `permission denied for ${failingUrl}`,
    );
  });
});
