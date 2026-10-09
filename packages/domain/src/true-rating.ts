import type { CatalogCard, Position } from '@fc27/data-sync';

import type { ChemistryStyle } from './rules/chemistry-styles.js';
import { TRUE_RATING_RULES } from './rules/true-rating.js';
import type { TrueRatingRules } from './rules/true-rating.js';

/**
 * The card's true rating at a position with a chemistry style at a chemistry,
 * 0.0–99.0 with one decimal (design §2).
 */
export function trueRating(
  _card: CatalogCard,
  _position: Position,
  _style: ChemistryStyle | null,
  _chemistry: number,
  _rules: TrueRatingRules = TRUE_RATING_RULES,
): number {
  throw new Error('Not implemented');
}

/**
 * The chemistry style that gives the highest true rating at the position and chemistry;
 * ties go to the lower style id, and there is none at 0 chemistry (design §3).
 */
export function bestChemistryStyle(
  _card: CatalogCard,
  _position: Position,
  _chemistry: number,
  _rules: TrueRatingRules = TRUE_RATING_RULES,
): ChemistryStyle | null {
  throw new Error('Not implemented');
}

export interface RatedSlot {
  readonly position: Position;
  /** The player's true rating; null for an empty slot, which counts as 0. */
  readonly rating: number | null;
}

/** The positional-weight average of the starting XI's true ratings, one decimal (design §5). */
export function squadTrueRating(
  _slots: readonly RatedSlot[],
  _rules: TrueRatingRules = TRUE_RATING_RULES,
): number {
  throw new Error('Not implemented');
}
