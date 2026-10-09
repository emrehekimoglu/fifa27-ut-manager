/** Chemistry rules of FC 27 Ultimate Team (PRD §7.1; ADR-0006). */

/** Players needed for 1, 2 and 3 points of club, league and nation chemistry. */
export const CHEMISTRY_THRESHOLDS = {
  club: [2, 4, 7],
  league: [3, 5, 8],
  nation: [2, 5, 8],
} as const satisfies Readonly<Record<'club' | 'league' | 'nation', readonly number[]>>;

/** A player's chemistry never exceeds this. */
export const MAX_PLAYER_CHEMISTRY = 3;

/**
 * A chemistry style's boost at 1 and 2 chemistry, by its boost at 3 chemistry.
 * At 3 chemistry the full boost applies; at 0 chemistry none.
 */
export const PARTIAL_STYLE_BOOSTS: Readonly<Record<1 | 2, Readonly<Record<number, number>>>> = {
  1: { 3: 1, 6: 2, 9: 3 },
  2: { 3: 2, 6: 4, 9: 6 },
};
