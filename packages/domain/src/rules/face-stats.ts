import type { Attributes, FaceStats, GoalkeeperFaceStats } from '@fc27/data-sync';

export type AttributeWeights = readonly (readonly [keyof Attributes, number])[];

/** How each outfield face stat is made of attributes (source: FUT.GG, 2026-10-09; ADR-0006). */
export const OUTFIELD_FACE_WEIGHTS: Readonly<Record<keyof FaceStats, AttributeWeights>> = {
  pace: [],
  shooting: [],
  passing: [],
  dribbling: [],
  defending: [],
  physicality: [],
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
