import type { CatalogCard, Position } from '@fc27/data-sync';
import { TRUE_RATING_RULES, bestChemistryStyle, trueRating } from '@fc27/domain';
import type { TrueRatingRules } from '@fc27/domain';

export interface TrueRatingRow {
  readonly position: Position;
  /** The rating with one decimal and a decimal comma, e.g. "87,7". */
  readonly rating: string;
  /** The best chemistry style's name. */
  readonly style: string;
}

const FULL_CHEMISTRY = 3;

const TRUE_RATING_FORMAT = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** A true rating as shown in the UI: one decimal with a decimal comma. */
export function formatTrueRating(rating: number): string {
  return TRUE_RATING_FORMAT.format(rating);
}

/** The card's true rating at each position it plays, with its best style at full chemistry. */
export function trueRatingRows(
  card: CatalogCard,
  rules: TrueRatingRules = TRUE_RATING_RULES,
): readonly TrueRatingRow[] {
  return [card.position, ...card.alternatePositions].flatMap((position) => {
    const style = bestChemistryStyle(card, position, FULL_CHEMISTRY, rules);
    if (style === null) return [];
    return [
      {
        position,
        rating: formatTrueRating(trueRating(card, position, style, FULL_CHEMISTRY, rules)),
        style: style.name,
      },
    ];
  });
}
