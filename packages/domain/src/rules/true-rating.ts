import type { AccelerateType, Attributes, Position } from '@fc27/data-sync';

/** Positions that share true-rating weights; mirrored positions are one group. */
export const POSITION_GROUPS = ['GK', 'CB', 'FB', 'CDM', 'CM', 'CAM', 'WM', 'W', 'ST'] as const;
export type PositionGroup = (typeof POSITION_GROUPS)[number];

export const POSITION_GROUP: Readonly<Record<Position, PositionGroup>> = {
  GK: 'GK',
  RB: 'FB',
  CB: 'CB',
  LB: 'FB',
  CDM: 'CDM',
  RM: 'WM',
  CM: 'CM',
  LM: 'WM',
  CAM: 'CAM',
  RW: 'W',
  ST: 'ST',
  LW: 'W',
};

/** The true-rating weights of one position group (design §2). */
export interface GroupWeights {
  /** Attribute weights; non-negative, summing to 1. */
  readonly attributes: Partial<Readonly<Record<keyof Attributes, number>>>;
  /** Points per weak-foot star above 3. */
  readonly weakFoot: number;
  /** Points per skill-move star above 3. */
  readonly skillMoves: number;
  /** Points for Explosive (−the same for Lengthy), scaled by `ACCELERATE_SCALE`. */
  readonly accelerate: number;
  /** Points per 5 cm above 180 cm, for at most 3 steps either way. */
  readonly height: number;
  /** Points per PlayStyle relevance unit (α). */
  readonly playStyles: number;
}

export interface TrueRatingRules {
  readonly groups: Readonly<Record<PositionGroup, GroupWeights>>;
  /** Relevance (1 useful, 2 core) of each PlayStyle id per group; absent means 0. */
  readonly playStyleRelevance: Readonly<
    Record<number, Partial<Readonly<Record<PositionGroup, number>>>>
  >;
  /** How much more a PlayStyle+ counts than a PlayStyle (β). */
  readonly playStylePlusMultiplier: number;
  /** The most points PlayStyles add. */
  readonly playStyleCap: number;
  readonly rolePlusBonus: number;
  readonly rolePlusPlusBonus: number;
  /** Weight of each slot's position in the squad true rating. */
  readonly squadWeights: Readonly<Record<PositionGroup, number>>;
}

/** Each AcceleRATE type on the Explosive (+1) to Lengthy (−1) scale (design §2.3). */
export const ACCELERATE_SCALE: Readonly<Record<AccelerateType, number>> = {
  explosive: 1,
  mostly_explosive: 2 / 3,
  controlled_explosive: 1 / 3,
  controlled: 0,
  controlled_lengthy: -1 / 3,
  mostly_lengthy: -2 / 3,
  lengthy: -1,
};

const UNFITTED: GroupWeights = {
  attributes: {},
  weakFoot: 0,
  skillMoves: 0,
  accelerate: 0,
  height: 0,
  playStyles: 0,
};

/** The true-rating rules (design: docs/domain/true-rating.md). */
export const TRUE_RATING_RULES: TrueRatingRules = {
  groups: {
    GK: UNFITTED,
    CB: UNFITTED,
    FB: UNFITTED,
    CDM: UNFITTED,
    CM: UNFITTED,
    CAM: UNFITTED,
    WM: UNFITTED,
    W: UNFITTED,
    ST: UNFITTED,
  },
  playStyleRelevance: {},
  playStylePlusMultiplier: 0,
  playStyleCap: 0,
  rolePlusBonus: 0,
  rolePlusPlusBonus: 0,
  squadWeights: { GK: 0, CB: 0, FB: 0, CDM: 0, CM: 0, CAM: 0, WM: 0, W: 0, ST: 0 },
};
