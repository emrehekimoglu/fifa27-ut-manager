import type { Attributes, FaceStats, GoalkeeperFaceStats } from '@fc27/data-sync';

export type AttributeWeights = readonly (readonly [keyof Attributes, number])[];

/** How each outfield face stat is made of attributes (source: FUT.GG, 2026-10-09; ADR-0006). */
export const OUTFIELD_FACE_WEIGHTS: Readonly<Record<keyof FaceStats, AttributeWeights>> = {
  pace: [
    ['acceleration', 0.45],
    ['sprintSpeed', 0.55],
  ],
  shooting: [
    ['positioning', 0.05],
    ['finishing', 0.45],
    ['shotPower', 0.2],
    ['longShots', 0.2],
    ['volleys', 0.05],
    ['penalties', 0.05],
  ],
  passing: [
    ['vision', 0.2],
    ['crossing', 0.2],
    ['freeKickAccuracy', 0.05],
    ['shortPassing', 0.35],
    ['longPassing', 0.15],
    ['curve', 0.05],
  ],
  dribbling: [
    ['agility', 0.1],
    ['balance', 0.05],
    ['reactions', 0.05],
    ['ballControl', 0.3],
    ['dribbling', 0.45],
    ['composure', 0.05],
  ],
  defending: [
    ['interceptions', 0.2],
    ['headingAccuracy', 0.1],
    ['defensiveAwareness', 0.3],
    ['standingTackle', 0.3],
    ['slidingTackle', 0.1],
  ],
  physicality: [
    ['jumping', 0.05],
    ['stamina', 0.25],
    ['strength', 0.5],
    ['aggression', 0.2],
  ],
};

/** How each goalkeeper face stat is made of attributes (source: FUT.GG, 2026-10-09; ADR-0006). */
export const GOALKEEPER_FACE_WEIGHTS: Readonly<
  Record<keyof GoalkeeperFaceStats, AttributeWeights>
> = {
  diving: [['gkDiving', 1]],
  handling: [['gkHandling', 1]],
  kicking: [['gkKicking', 1]],
  reflexes: [['gkReflexes', 1]],
  speed: [
    ['acceleration', 0.6],
    ['sprintSpeed', 0.4],
  ],
  positioning: [['gkPositioning', 1]],
};

/** No attribute or face stat exceeds this. */
export const MAX_STAT = 99;
