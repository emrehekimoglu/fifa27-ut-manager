import { z } from 'zod';

import type { CatalogCard } from '@fc27/data-sync';

import type { MetarankScore } from './metarank.js';

/** What the sampling step writes: the catalog cards and their meta ratings by EA id. */
export interface Sample {
  readonly takenAt: string;
  readonly cards: readonly CatalogCard[];
  /** Null for a card FUT.GG has no meta ratings for. */
  readonly metarank: Readonly<Record<string, readonly MetarankScore[] | null>>;
}

const sampleSchema = z.object({
  takenAt: z.string(),
  // The cards come from the stored catalog, which the sync has already validated.
  cards: z.array(z.custom<CatalogCard>((card) => typeof card === 'object' && card !== null)),
  metarank: z.record(
    z.string(),
    z
      .array(z.object({ role: z.number(), chemistryStyle: z.number(), score: z.number() }))
      .nullable(),
  ),
});

export function parseSample(body: unknown): Sample {
  return sampleSchema.parse(body);
}
