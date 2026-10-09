import type { Attributes, CatalogCard, FaceStats, GoalkeeperFaceStats } from '@fc27/data-sync';

import type { ChemistryStyle } from './rules/chemistry-styles.js';

export interface CardStats {
  readonly attributes: Attributes;
  readonly faceStats: FaceStats | null;
  readonly goalkeeperFaceStats: GoalkeeperFaceStats | null;
}

/** The chemistry styles a card can use: goalkeeper styles for goalkeepers, the others otherwise. */
export function stylesFor(_card: CatalogCard): readonly ChemistryStyle[] {
  throw new Error('Not implemented');
}

/** The boost of an attribute at `chemistry` (0–3), given its boost at 3 chemistry. */
export function styleBoost(_boostAtFullChemistry: number, _chemistry: number): number {
  throw new Error('Not implemented');
}

/** Outfield face stats computed from attributes, as the game does. */
export function outfieldFaceStats(_attributes: Attributes): FaceStats {
  throw new Error('Not implemented');
}

/** Goalkeeper face stats computed from attributes, as the game does. */
export function goalkeeperFaceStats(_attributes: Attributes): GoalkeeperFaceStats {
  throw new Error('Not implemented');
}

/** The card's stats with a chemistry style applied at the player's chemistry. */
export function applyChemistryStyle(
  _card: CatalogCard,
  _style: ChemistryStyle,
  _chemistry: number,
): CardStats {
  throw new Error('Not implemented');
}
