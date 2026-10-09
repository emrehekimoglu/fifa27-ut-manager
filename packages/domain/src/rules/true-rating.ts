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

/** The true-rating rules (design: docs/domain/true-rating.md). */
export const TRUE_RATING_RULES: TrueRatingRules = {
  // Fitted by @fc27/calibration; accuracy in docs/domain/true-rating-calibration.md.
  groups: {
    GK: {
      attributes: {
        gkPositioning: 0.32,
        gkKicking: 0.21,
        gkDiving: 0.18,
        gkHandling: 0.125,
        gkReflexes: 0.12,
        acceleration: 0.03,
        defensiveAwareness: 0.005,
        longPassing: 0.005,
        reactions: 0.005,
      },
      weakFoot: 0,
      skillMoves: 0,
      accelerate: -1.03,
      height: 1.94,
      playStyles: 0.02,
    },
    CB: {
      attributes: {
        slidingTackle: 0.19,
        strength: 0.18,
        aggression: 0.115,
        reactions: 0.09,
        standingTackle: 0.085,
        curve: 0.075,
        sprintSpeed: 0.07,
        jumping: 0.055,
        balance: 0.045,
        interceptions: 0.04,
        agility: 0.025,
        dribbling: 0.015,
        acceleration: 0.01,
        crossing: 0.005,
      },
      weakFoot: 1.08,
      skillMoves: 0,
      accelerate: -0.72,
      height: 0.33,
      playStyles: 0,
    },
    FB: {
      attributes: {
        acceleration: 0.15,
        balance: 0.14,
        interceptions: 0.125,
        agility: 0.115,
        strength: 0.095,
        composure: 0.09,
        ballControl: 0.075,
        shortPassing: 0.055,
        curve: 0.05,
        jumping: 0.05,
        shotPower: 0.025,
        crossing: 0.01,
        slidingTackle: 0.01,
        stamina: 0.01,
      },
      weakFoot: 0.97,
      skillMoves: 0,
      accelerate: -1.34,
      height: 0.54,
      playStyles: 0.11,
    },
    CDM: {
      attributes: {
        composure: 0.1,
        acceleration: 0.095,
        jumping: 0.09,
        reactions: 0.09,
        shortPassing: 0.09,
        standingTackle: 0.08,
        slidingTackle: 0.075,
        curve: 0.065,
        dribbling: 0.06,
        strength: 0.06,
        balance: 0.055,
        aggression: 0.045,
        defensiveAwareness: 0.035,
        positioning: 0.025,
        freeKickAccuracy: 0.02,
        shotPower: 0.01,
        agility: 0.005,
      },
      weakFoot: 0.37,
      skillMoves: 0.07,
      accelerate: -1.76,
      height: 0.28,
      playStyles: 0.01,
    },
    CM: {
      attributes: {
        composure: 0.145,
        shortPassing: 0.14,
        balance: 0.115,
        acceleration: 0.075,
        ballControl: 0.07,
        dribbling: 0.07,
        positioning: 0.07,
        strength: 0.07,
        jumping: 0.06,
        reactions: 0.05,
        shotPower: 0.035,
        slidingTackle: 0.035,
        agility: 0.02,
        curve: 0.02,
        aggression: 0.015,
        freeKickAccuracy: 0.01,
      },
      weakFoot: 0.98,
      skillMoves: 0.29,
      accelerate: -0.55,
      height: 0.33,
      playStyles: 0.02,
    },
    CAM: {
      attributes: {
        dribbling: 0.17,
        shortPassing: 0.125,
        positioning: 0.09,
        acceleration: 0.085,
        composure: 0.07,
        agility: 0.065,
        sprintSpeed: 0.065,
        vision: 0.065,
        jumping: 0.055,
        ballControl: 0.045,
        balance: 0.035,
        shotPower: 0.035,
        longShots: 0.03,
        penalties: 0.025,
        volleys: 0.015,
        headingAccuracy: 0.01,
        aggression: 0.005,
        freeKickAccuracy: 0.005,
        slidingTackle: 0.005,
      },
      weakFoot: 0.85,
      skillMoves: 0,
      accelerate: 0.46,
      height: 0.28,
      playStyles: 0,
    },
    WM: {
      attributes: {
        acceleration: 0.235,
        dribbling: 0.11,
        composure: 0.095,
        shotPower: 0.085,
        sprintSpeed: 0.085,
        shortPassing: 0.065,
        agility: 0.055,
        balance: 0.04,
        curve: 0.04,
        reactions: 0.04,
        freeKickAccuracy: 0.035,
        jumping: 0.03,
        penalties: 0.03,
        longPassing: 0.025,
        slidingTackle: 0.015,
        finishing: 0.01,
        strength: 0.005,
      },
      weakFoot: 0.96,
      skillMoves: 0.23,
      accelerate: -0.21,
      height: 0.08,
      playStyles: 0.02,
    },
    W: {
      attributes: {
        acceleration: 0.17,
        sprintSpeed: 0.17,
        composure: 0.145,
        curve: 0.055,
        dribbling: 0.055,
        positioning: 0.055,
        agility: 0.05,
        balance: 0.05,
        shotPower: 0.045,
        freeKickAccuracy: 0.035,
        longPassing: 0.035,
        jumping: 0.025,
        reactions: 0.025,
        volleys: 0.025,
        headingAccuracy: 0.02,
        strength: 0.02,
        finishing: 0.015,
        longShots: 0.005,
      },
      weakFoot: 0.62,
      skillMoves: 0.09,
      accelerate: 0.14,
      height: -0.16,
      playStyles: 0,
    },
    ST: {
      attributes: {
        sprintSpeed: 0.205,
        dribbling: 0.105,
        jumping: 0.1,
        composure: 0.095,
        positioning: 0.08,
        shotPower: 0.08,
        agility: 0.075,
        acceleration: 0.06,
        shortPassing: 0.06,
        curve: 0.04,
        longShots: 0.04,
        strength: 0.025,
        aggression: 0.01,
        ballControl: 0.01,
        balance: 0.005,
        freeKickAccuracy: 0.005,
        headingAccuracy: 0.005,
      },
      weakFoot: 0.27,
      skillMoves: 0.29,
      accelerate: 0.44,
      height: -0.08,
      playStyles: 0,
    },
  },
  // The approved design's table, docs/domain/true-rating.md §2.5.
  playStyleRelevance: {
    0: { CM: 1, CAM: 2, WM: 1, W: 2, ST: 2 }, // Finesse Shot
    1: { CAM: 1, W: 1, ST: 1 }, // Chip Shot
    2: { CM: 1, CAM: 1, WM: 1, W: 1, ST: 2 }, // Power Shot
    3: { FB: 1, CM: 1, CAM: 1, WM: 1, W: 1, ST: 1 }, // Dead Ball
    5: { CDM: 1, CM: 2, CAM: 2, WM: 1, W: 1, ST: 1 }, // Incisive Pass
    6: { CB: 1, FB: 1, CDM: 2, CM: 2, CAM: 1, WM: 1, W: 1 }, // Pinged Pass
    7: { CB: 1, FB: 1, CDM: 2, CM: 2, CAM: 1, WM: 1 }, // Long Ball Pass
    8: { CB: 1, FB: 1, CDM: 2, CM: 2, CAM: 2, WM: 1, W: 1, ST: 1 }, // Tiki Taka
    9: { FB: 2, CM: 1, WM: 2, W: 1 }, // Whipped Pass
    10: { CB: 2, FB: 2, CDM: 2, CM: 1 }, // Jockey
    11: { CB: 2, FB: 1, CDM: 1 }, // Block
    12: { CB: 2, FB: 2, CDM: 2, CM: 1 }, // Intercept
    13: { CB: 2, FB: 1, CDM: 2, CM: 1 }, // Anticipate
    14: { CB: 1, FB: 1, CDM: 1 }, // Slide Tackle
    15: { CB: 2, FB: 1, CDM: 2, CM: 1, ST: 1 }, // Bruiser
    16: { CM: 1, CAM: 2, WM: 2, W: 2, ST: 1 }, // Technical
    17: { FB: 1, CAM: 1, WM: 2, W: 2, ST: 2 }, // Rapid
    19: { CM: 1, CAM: 2, WM: 1, W: 2, ST: 2 }, // First Touch
    20: { CAM: 1, WM: 1, W: 1, ST: 1 }, // Trickster
    21: { CB: 1, FB: 1, CDM: 2, CM: 2, CAM: 2, WM: 1, W: 1, ST: 1 }, // Press Proven
    22: { CB: 1, FB: 2, CDM: 1, CM: 1, CAM: 2, WM: 2, W: 2, ST: 2 }, // Quick Step
    23: { CB: 1, FB: 2, CDM: 2, CM: 2, WM: 1, W: 1, ST: 1 }, // Relentless
    25: { CAM: 1, W: 1, ST: 1 }, // Acrobatic
    26: { FB: 1 }, // Long Throw
    28: { GK: 1 }, // Far Throw
    29: { GK: 2 }, // Footwork
    30: { GK: 2 }, // Cross Claimer
    31: { GK: 2 }, // 1v1 Close Down
    32: { GK: 2 }, // Far Reach
    33: { GK: 2 }, // Deflector
    34: { CM: 1, CAM: 1, WM: 1, W: 1, ST: 1 }, // Low Driven Shot
    35: { CB: 2, FB: 1, CDM: 1, ST: 1 }, // Aerial Fortress
    36: { CB: 2, FB: 1, CDM: 2, CM: 1, ST: 1 }, // Enforcer
    37: { CM: 1, CAM: 2, WM: 1, W: 2, ST: 2 }, // Gamechanger
    38: { CM: 1, CAM: 2, WM: 1, W: 1, ST: 1 }, // Inventive
    39: { CB: 1, W: 1, ST: 2 }, // Precision Header
  },
  playStylePlusMultiplier: 1,
  playStyleCap: 6,
  rolePlusBonus: 0.5,
  rolePlusPlusBonus: 1,
  squadWeights: { GK: 1, CB: 1, FB: 1, CDM: 1, CM: 1, CAM: 1, WM: 1, W: 1, ST: 1 },
};
