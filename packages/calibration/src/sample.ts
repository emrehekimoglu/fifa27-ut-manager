import type { FetchFn, Position } from '@fc27/data-sync';
import { POSITION_GROUP } from '@fc27/domain';

import { fetchMetarank } from './metarank.js';
import { at } from './vector.js';
import type { MetarankScore } from './metarank.js';

/** Cards sampled per position group (design §4). */
export const CARDS_PER_GROUP = 80;

/** Pause between FUT.GG requests (design §4). */
export const REQUEST_DELAY_MS = 2000;

export interface SampleCandidate {
  readonly eaId: number;
  readonly overall: number;
  readonly position: Position;
}

/**
 * Up to `perGroup` cards of each position group, by primary position, evenly spread over
 * the group's cards sorted by overall and EA id, so every overall band is represented.
 */
export function pickSample<T extends SampleCandidate>(
  cards: readonly T[],
  perGroup: number = CARDS_PER_GROUP,
): T[] {
  const groups = new Map<string, T[]>();
  for (const card of cards) {
    const group = POSITION_GROUP[card.position];
    const members = groups.get(group);
    if (members) members.push(card);
    else groups.set(group, [card]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([, members]) => {
      members.sort((a, b) => a.overall - b.overall || a.eaId - b.eaId);
      const count = Math.min(perGroup, members.length);
      return Array.from({ length: count }, (_, index) =>
        at(members, Math.floor((index * members.length) / count)),
      );
    });
}

export interface CollectDeps {
  readonly fetch: FetchFn;
  readonly sleep: (milliseconds: number) => Promise<void>;
  readonly delayMs: number;
  readonly onProgress?: (done: number, total: number) => void;
}

/**
 * The meta ratings of each card, one plain request at a time with a pause before each but
 * the first. The first refusal other than a 404 stops the collection (design §4).
 */
export async function collectMetarank(
  eaIds: readonly number[],
  deps: CollectDeps,
): Promise<Record<string, MetarankScore[] | null>> {
  const collected: Record<string, MetarankScore[] | null> = {};
  for (const [index, eaId] of eaIds.entries()) {
    if (index > 0) await deps.sleep(deps.delayMs);
    collected[String(eaId)] = await fetchMetarank(eaId, deps.fetch);
    deps.onProgress?.(index + 1, eaIds.length);
  }
  return collected;
}
