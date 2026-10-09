import type { Attributes, CatalogCard, FaceStats, GoalkeeperFaceStats } from '@fc27/data-sync';

import { PARTIAL_STYLE_BOOSTS } from './rules/chemistry.js';
import { CHEMISTRY_STYLES } from './rules/chemistry-styles.js';
import type { ChemistryStyle } from './rules/chemistry-styles.js';
import { GOALKEEPER_FACE_WEIGHTS, MAX_STAT, OUTFIELD_FACE_WEIGHTS } from './rules/face-stats.js';
import type { AttributeWeights } from './rules/face-stats.js';

export interface CardStats {
  readonly attributes: Attributes;
  readonly faceStats: FaceStats | null;
  readonly goalkeeperFaceStats: GoalkeeperFaceStats | null;
}

const isGoalkeeper = (card: CatalogCard) => card.position === 'GK';

/** The chemistry styles a card can use: goalkeeper styles for goalkeepers, the others otherwise. */
export function stylesFor(card: CatalogCard): readonly ChemistryStyle[] {
  return CHEMISTRY_STYLES.filter((style) => style.goalkeeper === isGoalkeeper(card));
}

/** The boost of an attribute at `chemistry` (0–3), given its boost at 3 chemistry. */
export function styleBoost(boostAtFullChemistry: number, chemistry: number): number {
  if (chemistry <= 0) return 0;
  if (chemistry >= 3) return boostAtFullChemistry;
  return PARTIAL_STYLE_BOOSTS[chemistry as 1 | 2][boostAtFullChemistry] ?? 0;
}

/** A face stat as the game computes it: the weighted attributes, rounded, capped at 99. */
function faceStat(attributes: Attributes, weights: AttributeWeights): number {
  const weighted = weights.reduce(
    (sum, [attribute, weight]) => sum + attributes[attribute] * weight,
    0,
  );
  return Math.min(MAX_STAT, Math.floor(weighted + 0.501));
}

function faceStatsWith<Face extends string>(
  attributes: Attributes,
  weights: Readonly<Record<Face, AttributeWeights>>,
): Record<Face, number> {
  const entries = Object.entries<AttributeWeights>(weights).map(([face, faceWeights]) => [
    face,
    faceStat(attributes, faceWeights),
  ]);
  return Object.fromEntries(entries) as Record<Face, number>;
}

/** Outfield face stats computed from attributes, as the game does. */
export function outfieldFaceStats(attributes: Attributes): FaceStats {
  return faceStatsWith(attributes, OUTFIELD_FACE_WEIGHTS);
}

/** Goalkeeper face stats computed from attributes, as the game does. */
export function goalkeeperFaceStats(attributes: Attributes): GoalkeeperFaceStats {
  return faceStatsWith(attributes, GOALKEEPER_FACE_WEIGHTS);
}

/** The card's stats with a chemistry style applied at the player's chemistry. */
export function applyChemistryStyle(
  card: CatalogCard,
  style: ChemistryStyle,
  chemistry: number,
): CardStats {
  if (style.goalkeeper !== isGoalkeeper(card)) {
    const kind = style.goalkeeper ? 'a goalkeeper' : 'an outfield';
    throw new Error(`${style.name} is ${kind} style and cannot be used by a ${card.position}`);
  }
  const unchanged: CardStats = {
    attributes: card.attributes,
    faceStats: card.faceStats,
    goalkeeperFaceStats: card.goalkeeperFaceStats,
  };
  if (chemistry <= 0) return unchanged;

  const attributes = { ...card.attributes };
  for (const [attribute, boost] of Object.entries(style.boosts) as [keyof Attributes, number][]) {
    attributes[attribute] = Math.min(
      MAX_STAT,
      attributes[attribute] + styleBoost(boost, chemistry),
    );
  }
  return {
    attributes,
    faceStats: card.faceStats && outfieldFaceStats(attributes),
    goalkeeperFaceStats: card.goalkeeperFaceStats && goalkeeperFaceStats(attributes),
  };
}
