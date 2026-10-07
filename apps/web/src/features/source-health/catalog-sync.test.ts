import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import { fetchLatestCatalogSync, formatSyncTime, syncStatusLabel } from './catalog-sync';

const SUPABASE_URL = 'https://project.supabase.co';

/** A Supabase client whose HTTP requests are answered by `respond`. */
function clientAnswering(respond: (url: string) => Response): {
  client: SupabaseClient;
  requests: string[];
} {
  const requests: string[] = [];
  const client = createClient(SUPABASE_URL, 'sb_publishable_test', {
    auth: { persistSession: false },
    global: {
      fetch: (input: RequestInfo | URL) => {
        const url = input instanceof Request ? input.url : String(input);
        requests.push(url);
        return Promise.resolve(respond(url));
      },
    },
  });
  return { client, requests };
}

describe('fetchLatestCatalogSync', () => {
  it('reads the newest sync row and maps it to a sync record', async () => {
    const { client, requests } = clientAnswering(() =>
      Response.json([
        {
          id: 12,
          started_at: '2026-10-07T03:47:05+00:00',
          finished_at: '2026-10-07T04:11:52.123+00:00',
          status: 'succeeded',
          source: 'futgg',
          card_count: 19958,
          deactivated_count: 4,
          error: null,
        },
      ]),
    );

    expect(await fetchLatestCatalogSync(client)).toEqual({
      id: 12,
      startedAt: '2026-10-07T03:47:05.000Z',
      finishedAt: '2026-10-07T04:11:52.123Z',
      status: 'succeeded',
      source: 'futgg',
      cardCount: 19958,
      deactivatedCount: 4,
      error: null,
    });
    expect(requests).toEqual([
      `${SUPABASE_URL}/rest/v1/catalog_syncs?select=*&order=id.desc&limit=1`,
    ]);
  });

  it('keeps an unfinished sync without a finish time', async () => {
    const { client } = clientAnswering(() =>
      Response.json([
        {
          id: 13,
          started_at: '2026-10-08T03:47:00+00:00',
          finished_at: null,
          status: 'running',
          source: null,
          card_count: null,
          deactivated_count: null,
          error: null,
        },
      ]),
    );

    expect(await fetchLatestCatalogSync(client)).toMatchObject({
      id: 13,
      status: 'running',
      finishedAt: null,
    });
  });

  it('returns null before the first sync', async () => {
    const { client } = clientAnswering(() => Response.json([]));
    expect(await fetchLatestCatalogSync(client)).toBeNull();
  });

  it('fails with the database error message', async () => {
    const { client } = clientAnswering(() =>
      Response.json({ message: 'permission denied for table catalog_syncs' }, { status: 401 }),
    );
    await expect(fetchLatestCatalogSync(client)).rejects.toThrow(
      'permission denied for table catalog_syncs',
    );
  });
});

describe('syncStatusLabel', () => {
  it('labels every status in Turkish', () => {
    expect(syncStatusLabel('succeeded')).toBe('Başarılı');
    expect(syncStatusLabel('failed')).toBe('Başarısız');
    expect(syncStatusLabel('running')).toBe('Çalışıyor');
  });
});

describe('formatSyncTime', () => {
  it('shows the date and clock time in Türkiye (UTC+3)', () => {
    expect(formatSyncTime('2026-10-07T03:47:05.000Z')).toBe('7 Ekim 2026 06:47');
    expect(formatSyncTime('2026-12-31T21:30:00.000Z')).toBe('1 Ocak 2027 00:30');
  });
});
