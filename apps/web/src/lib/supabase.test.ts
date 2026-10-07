import { afterEach, describe, expect, it, vi } from 'vitest';

const PROJECT_URL = 'https://project.supabase.co';

/** Imports a fresh copy of the module, so each test sees its own environment. */
async function loadBrowserSupabase() {
  vi.resetModules();
  return (await import('./supabase')).browserSupabase;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('browserSupabase', () => {
  it('is null when the deployment has no Supabase URL', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    expect((await loadBrowserSupabase())()).toBeNull();
  });

  it('is null when the deployment has no publishable key', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', PROJECT_URL);
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    expect((await loadBrowserSupabase())()).toBeNull();
  });

  it('creates one client for the configured project and reuses it', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', PROJECT_URL);
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    const browserSupabase = await loadBrowserSupabase();

    const requests: string[] = [];
    vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
      requests.push(input instanceof Request ? input.url : String(input));
      return Promise.resolve(Response.json([]));
    });

    const client = browserSupabase();
    await client?.from('catalog_syncs').select('*');

    expect(requests).toEqual([`${PROJECT_URL}/rest/v1/catalog_syncs?select=*`]);
    expect(browserSupabase()).toBe(client);
  });
});
