import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveAccess, returnAddress, signInWithGoogle, signOut } from './access';

const PROJECT_URL = 'https://project.supabase.co';
// supabase-js keys the stored session by the first label of the project host.
const STORAGE_KEY = 'sb-project-auth-token';
const EMAIL = 'oyuncu@example.com';

interface Request {
  readonly method: string;
  readonly url: string;
}

/** A stored session that expires in 2100, so no token refresh is attempted. */
function storedSession(email: string): string {
  return JSON.stringify({
    access_token: 'header.payload.signature',
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 4_102_444_800,
    user: {
      id: '0b5c8f5e-3c1d-4f3e-9a51-2f6c7d8e9a10',
      aud: 'authenticated',
      role: 'authenticated',
      email,
      app_metadata: { provider: 'google', providers: ['google'] },
      user_metadata: {},
      created_at: '2026-10-16T09:00:00Z',
    },
  });
}

/** A client whose storage holds `session` and whose network answers with `respond`. */
function clientWith(
  session: string | null,
  respond: (request: Request) => Response = () => Response.json(null),
): { client: SupabaseClient; requests: Request[] } {
  const items = new Map<string, string>(session === null ? [] : [[STORAGE_KEY, session]]);
  const requests: Request[] = [];
  const fetchStub = (input: RequestInfo | URL, init?: RequestInit) => {
    const request = {
      method: init?.method ?? 'GET',
      url: input instanceof Request ? input.url : String(input),
    };
    requests.push(request);
    return Promise.resolve(respond(request));
  };
  const client = createClient(PROJECT_URL, 'sb_publishable_test', {
    global: { fetch: fetchStub },
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key) => items.get(key) ?? null,
        setItem: (key, value) => {
          items.set(key, value);
        },
        removeItem: (key) => {
          items.delete(key);
        },
      },
    },
  });
  return { client, requests };
}

const IS_ALLOWED = { method: 'POST', url: `${PROJECT_URL}/rest/v1/rpc/is_allowed` };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('resolveAccess', () => {
  it('is unconfigured when the deployment has no Supabase client', async () => {
    expect(await resolveAccess(null)).toEqual({ status: 'unconfigured' });
  });

  it('is signed out without a stored session, and asks the database nothing', async () => {
    const { client, requests } = clientWith(null);

    expect(await resolveAccess(client)).toEqual({ status: 'signed-out' });
    expect(requests).toEqual([]);
  });

  it('lets in a signed-in account the database allows', async () => {
    const { client, requests } = clientWith(storedSession(EMAIL), () => Response.json(true));

    expect(await resolveAccess(client)).toEqual({ status: 'allowed', email: EMAIL });
    expect(requests).toEqual([IS_ALLOWED]);
  });

  it('denies a signed-in account the database does not allow', async () => {
    const { client } = clientWith(storedSession('yabanci@example.com'), () => Response.json(false));

    expect(await resolveAccess(client)).toEqual({
      status: 'denied',
      email: 'yabanci@example.com',
    });
  });

  it('reports the database error when the check fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { client } = clientWith(storedSession(EMAIL), () =>
      Response.json(
        { code: 'PGRST202', message: 'Could not find the function public.is_allowed' },
        { status: 404 },
      ),
    );

    expect(await resolveAccess(client)).toEqual({
      status: 'error',
      message: 'Could not find the function public.is_allowed',
    });
  });
});

describe('signInWithGoogle', () => {
  it('sends the user to Google through Supabase and back to the page they were on', async () => {
    const { client } = clientWith(null);

    expect(await signInWithGoogle(client, 'https://app.example/katalog?q=pele')).toEqual({
      url: `${PROJECT_URL}/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fapp.example%2Fkatalog%3Fq%3Dpele`,
    });
  });
});

describe('signOut', () => {
  it('ends the session on this device only, leaving other devices signed in', async () => {
    const { client, requests } = clientWith(
      storedSession(EMAIL),
      () => new Response(null, { status: 204 }),
    );

    await signOut(client);

    expect(requests).toEqual([
      { method: 'POST', url: `${PROJECT_URL}/auth/v1/logout?scope=local` },
    ]);
    expect(await resolveAccess(client)).toEqual({ status: 'signed-out' });
  });
});

describe('returnAddress', () => {
  it('keeps the page and its query but drops the fragment', () => {
    expect(
      returnAddress({
        origin: 'https://fifa27-ut-manager.vercel.app',
        pathname: '/katalog/50331648',
        search: '?sekme=statlar',
      }),
    ).toBe('https://fifa27-ut-manager.vercel.app/katalog/50331648?sekme=statlar');
  });
});
