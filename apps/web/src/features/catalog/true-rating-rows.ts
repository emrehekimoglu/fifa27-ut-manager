import type { CatalogCard, Position } from '@fc27/data-sync';
import { TRUE_RATING_RULES } from '@fc27/domain';
import type { TrueRatingRules } from '@fc27/domain';

export interface TrueRatingRow {
  readonly position: Position;
  /** The rating with one decimal and a decimal comma, e.g. "87,7". */
  readonly rating: string;
  /** The best chemistry style's name. */
  readonly style: string;
}

/** A true rating as shown in the UI: one decimal with a decimal comma. */
export function formatTrueRating(_rating: number): string {
  throw new Error('Not implemented');
}

/** The card's true rating at each position it plays, with its best style at full chemistry. */
export function trueRatingRows(
  _card: CatalogCard,
  _rules: TrueRatingRules = TRUE_RATING_RULES,
): readonly TrueRatingRow[] {
  throw new Error('Not implemented');
}
