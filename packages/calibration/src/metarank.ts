import { z } from 'zod';

import { getJson, SourceHttpError } from '@fc27/data-sync';
import type { FetchFn, Position } from '@fc27/data-sync';

/** One FUT.GG meta rating: a card in one role with one chemistry style. */
export interface MetarankScore {
  /** FUT.GG's own role id; see `METARANK_ROLE_POSITIONS`. */
  readonly role: number;
  /** Chemistry-style id, as in `CHEMISTRY_STYLES`. */
  readonly chemistryStyle: number;
  readonly score: number;
}

/**
 * The position of each metarank role id. FUT.GG numbers its roles in one block per
 * position, with roles added later appended at the end (71–75). The blocks were found by
 * checking which positions the scored cards can play; mirrored sides (RB and LB, RM and LM,
 * RW and LW) share a true-rating group, so a swapped side would not change the fit.
 */
export const METARANK_ROLE_POSITIONS: Readonly<Record<number, Position>> = {
  1: 'GK',
  2: 'GK',
  71: 'GK',
  3: 'CB',
  4: 'CB',
  5: 'CB',
  72: 'CB',
  6: 'RB',
  7: 'RB',
  8: 'RB',
  9: 'RB',
  74: 'RB',
  10: 'LB',
  11: 'LB',
  12: 'LB',
  13: 'LB',
  73: 'LB',
  14: 'CDM',
  15: 'CDM',
  16: 'CDM',
  17: 'CDM',
  75: 'CDM',
  23: 'CM',
  24: 'CM',
  25: 'CM',
  26: 'CM',
  27: 'CM',
  37: 'CAM',
  38: 'CAM',
  39: 'CAM',
  40: 'CAM',
  45: 'RM',
  46: 'RM',
  47: 'RM',
  48: 'RM',
  49: 'LM',
  50: 'LM',
  51: 'LM',
  52: 'LM',
  53: 'RW',
  54: 'RW',
  55: 'RW',
  56: 'LW',
  57: 'LW',
  58: 'LW',
  63: 'ST',
  64: 'ST',
  65: 'ST',
  66: 'ST',
};

const metarankSchema = z.object({
  data: z.object({
    scores: z.array(
      z.object({ role: z.number().int(), chemistryStyle: z.number().int(), score: z.number() }),
    ),
  }),
});

export function parseMetarank(body: unknown): MetarankScore[] {
  return metarankSchema
    .parse(body)
    .data.scores.map(({ role, chemistryStyle, score }) => ({ role, chemistryStyle, score }));
}

/** The card's meta ratings; null when FUT.GG has none for it (HTTP 404). */
export async function fetchMetarank(
  eaId: number,
  fetchFn: FetchFn,
): Promise<MetarankScore[] | null> {
  try {
    return parseMetarank(
      await getJson('futgg', `https://www.fut.gg/api/fut/metarank/player/${eaId}/`, fetchFn),
    );
  } catch (error) {
    if (error instanceof SourceHttpError && error.status === 404) return null;
    throw error;
  }
}
