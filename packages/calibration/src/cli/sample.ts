/**
 * Step 1 of the true-rating calibration workflow (.github/workflows/true-rating-calibration.yml):
 * picks the sample from the stored catalog and fetches its FUT.GG meta ratings.
 * Reads SUPABASE_URL and SUPABASE_SECRET_KEY; writes <out>/sample.json.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { createClient } from '@supabase/supabase-js';

import type { CatalogCard, Position } from '@fc27/data-sync';

import { collectMetarank, pickSample, REQUEST_DELAY_MS } from '../sample.js';
import type { Sample } from '../sample-file.js';

const PAGE_SIZE = 1000;
const DATA_BATCH_SIZE = 100;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const out = process.argv[2] ?? 'calibration';
const client = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SECRET_KEY'), {
  auth: { persistSession: false },
});

const candidates: { eaId: number; overall: number; position: Position }[] = [];
for (let from = 0; ; from += PAGE_SIZE) {
  const { data, error } = await client
    .from('cards')
    .select('ea_id,overall,position')
    .eq('is_active', true)
    .order('ea_id')
    .range(from, from + PAGE_SIZE - 1)
    .overrideTypes<{ ea_id: number; overall: number; position: Position }[], { merge: false }>();
  if (error) throw new Error(`[supabase] read cards: ${error.message}`);
  candidates.push(
    ...data.map((row) => ({ eaId: row.ea_id, overall: row.overall, position: row.position })),
  );
  if (data.length < PAGE_SIZE) break;
}

const chosen = pickSample(candidates).map((card) => card.eaId);
const cards: CatalogCard[] = [];
for (let start = 0; start < chosen.length; start += DATA_BATCH_SIZE) {
  const { data, error } = await client
    .from('cards')
    .select('data')
    .in('ea_id', chosen.slice(start, start + DATA_BATCH_SIZE))
    .overrideTypes<{ data: CatalogCard }[], { merge: false }>();
  if (error) throw new Error(`[supabase] read card data: ${error.message}`);
  cards.push(...data.map((row) => row.data));
}
cards.sort((a, b) => a.eaId - b.eaId);
console.log(`sampled ${cards.length} of ${candidates.length} active cards`);

const metarank = await collectMetarank(
  cards.map((card) => card.eaId),
  {
    fetch,
    sleep: (milliseconds) => sleep(milliseconds).then(() => undefined),
    delayMs: REQUEST_DELAY_MS,
    onProgress: (done, total) => {
      if (done % 50 === 0 || done === total) console.log(`meta ratings ${done}/${total}`);
    },
  },
);

const sample: Sample = { takenAt: new Date().toISOString(), cards, metarank };
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'sample.json'), JSON.stringify(sample));
