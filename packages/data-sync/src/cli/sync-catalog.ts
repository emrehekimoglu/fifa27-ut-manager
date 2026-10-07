/**
 * Entry point of the scheduled catalog sync (.github/workflows/catalog-sync.yml).
 * Reads SUPABASE_URL and SUPABASE_SECRET_KEY from the environment.
 */
import { setTimeout as sleep } from 'node:timers/promises';

import { createClient } from '@supabase/supabase-js';

import { CATALOG_PARTITIONS, fetchEaCatalog, fetchFutggCatalog } from '../catalog-fetch.js';
import { runCatalogSync } from '../catalog-sync.js';
import { createSupabaseCatalogStore } from '../supabase-catalog-store.js';

/** Pause between source requests, to keep the load on FUT.GG and EA low. */
const REQUEST_DELAY_MS = 1000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const client = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SECRET_KEY'), {
  auth: { persistSession: false },
});
const pause = (milliseconds: number) => sleep(milliseconds).then(() => undefined);

const result = await runCatalogSync({
  store: createSupabaseCatalogStore(client),
  fetchPrimary: () =>
    fetchFutggCatalog({
      fetch,
      sleep: pause,
      delayMs: REQUEST_DELAY_MS,
      partitions: CATALOG_PARTITIONS,
    }),
  fetchFallback: () =>
    fetchEaCatalog({
      fetch,
      sleep: pause,
      delayMs: REQUEST_DELAY_MS,
      pageSize: 100,
      cacheBust: String(Date.now()),
    }),
  now: Date.now,
});

console.log(JSON.stringify(result));
if (result.status !== 'succeeded') process.exitCode = 1;
