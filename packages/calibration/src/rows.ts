import type { CatalogCard, Position } from '@fc27/data-sync';
import { POSITION_GROUP, stylesFor, trueRatingTerms } from '@fc27/domain';
import type { PositionGroup, TrueRatingTerms } from '@fc27/domain';

import { METARANK_ROLE_POSITIONS } from './metarank.js';
import type { MetarankScore } from './metarank.js';

/** Meta ratings are taken to be at full chemistry (design §4). */
const FULL_CHEMISTRY = 3;

/** One card at one position with one chemistry style, against its reference rating. */
export interface CalibrationRow {
  readonly eaId: number;
  readonly name: string;
  readonly position: Position;
  readonly group: PositionGroup;
  readonly style: string;
  readonly terms: TrueRatingTerms;
  /** The best meta rating among the position's roles with this style. */
  readonly reference: number;
}

/**
 * The card's calibration rows: one per position it can play and chemistry style it can
 * use, in the order of its positions and then of the style ids.
 */
export function calibrationRows(
  card: CatalogCard,
  scores: readonly MetarankScore[],
): CalibrationRow[] {
  const positions = [card.position, ...card.alternatePositions];
  const styles = [...stylesFor(card)].sort((a, b) => a.id - b.id);
  return positions.flatMap((position) =>
    styles.flatMap((style) => {
      const matching = scores.filter(
        (score) =>
          score.chemistryStyle === style.id && METARANK_ROLE_POSITIONS[score.role] === position,
      );
      if (matching.length === 0) return [];
      return [
        {
          eaId: card.eaId,
          name: card.name,
          position,
          group: POSITION_GROUP[position],
          style: style.name,
          terms: trueRatingTerms(card, position, style, FULL_CHEMISTRY),
          reference: Math.max(...matching.map((score) => score.score)),
        },
      ];
    }),
  );
}

/**
 * Whether the scores cover exactly the positions the card plays. Some meta ratings belong
 * to another version of the card, with other positions and far lower scores; they are
 * left out rather than fitted.
 */
export function scoresMatchCard(card: CatalogCard, scores: readonly MetarankScore[]): boolean {
  const scored = new Set(scores.map((score) => METARANK_ROLE_POSITIONS[score.role]));
  return scored.has(card.position);
}
