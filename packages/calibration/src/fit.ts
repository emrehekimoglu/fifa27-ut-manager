import type { Attributes } from '@fc27/data-sync';
import { POSITION_GROUPS, ratingFromTerms, TRUE_RATING_RULES } from '@fc27/domain';
import type { GroupWeights, PositionGroup, TrueRatingRules } from '@fc27/domain';

import { meanAbsoluteError } from './metrics.js';
import { nonNegativeLeastSquares } from './nnls.js';
import { at, dot } from './vector.js';
import type { CalibrationRow } from './rows.js';

export interface FitOptions {
  /** L2 penalty per row on every coefficient, so no weight swings wildly on sparse data. */
  readonly ridge: number;
  /** Candidate values of β, the PlayStyle+ multiplier; the first best one wins. */
  readonly plusMultipliers: readonly number[];
}

export const FIT_OPTIONS: FitOptions = { ridge: 0.01, plusMultipliers: [1, 1.5, 2, 2.5, 3] };

/** Attribute weights are rounded to this step before they are committed (design §4). */
const ATTRIBUTE_STEP = 0.005;
/** How strongly the fit holds the attribute weights to a sum of 1. */
const SUM_PENALTY = 1e4;

type AttributeKey = keyof Attributes;

/** Goalkeepers may weigh any attribute; outfield players only the outfield ones. */
function attributeKeys(group: PositionGroup, rows: readonly CalibrationRow[]): AttributeKey[] {
  const keys = Object.keys(at(rows, 0).terms.attributes) as AttributeKey[];
  return group === 'GK' ? keys : keys.filter((key) => !key.startsWith('gk'));
}

/** The design's terms as columns; signed terms get a positive and a negative column. */
function columns(group: PositionGroup, plusMultiplier: number) {
  return [
    { name: 'weakFoot', of: (row: CalibrationRow) => row.terms.weakFoot },
    ...(group === 'GK'
      ? []
      : [{ name: 'skillMoves', of: (row: CalibrationRow) => row.terms.skillMoves }]),
    { name: 'accelerate', of: (row: CalibrationRow) => row.terms.accelerate },
    { name: 'accelerate', of: (row: CalibrationRow) => -row.terms.accelerate, negative: true },
    { name: 'height', of: (row: CalibrationRow) => row.terms.height },
    { name: 'height', of: (row: CalibrationRow) => -row.terms.height, negative: true },
    {
      name: 'playStyles',
      of: (row: CalibrationRow) => row.terms.playStyles + plusMultiplier * row.terms.playStylesPlus,
    },
  ] as const;
}

/**
 * Least-squares weights of one group (design §4): attribute weights non-negative and summing
 * to 1, weak foot, skill moves and PlayStyles non-negative, AcceleRATE and height of either
 * sign. The role bonus is fixed, so it is taken off the reference first.
 */
export function fitGroup(
  group: PositionGroup,
  rows: readonly CalibrationRow[],
  plusMultiplier: number,
  ridge: number,
): GroupWeights {
  if (rows.length === 0) throw new Error(`no calibration rows for ${group}`);
  const keys = attributeKeys(group, rows);
  const extra = columns(group, plusMultiplier);
  const features = rows.map((row) => [
    ...keys.map((key) => row.terms.attributes[key]),
    ...extra.map((column) => column.of(row)),
  ]);
  const targets = rows.map((row) => row.reference - row.terms.role);
  const columnsOf = keys.length + extra.length;
  const column = Array.from({ length: columnsOf }, (_, index) =>
    features.map((feature) => at(feature, index)),
  );

  const gram = Array.from({ length: columnsOf }, (_, i) =>
    Array.from(
      { length: columnsOf },
      (_, j) => dot(at(column, i), at(column, j)) / rows.length + (i === j ? ridge : 0),
    ),
  );
  const moment = Array.from(
    { length: columnsOf },
    (_, i) => dot(at(column, i), targets) / rows.length,
  );
  const scale = SUM_PENALTY * Math.max(...gram.map((row, i) => at(row, i)));
  keys.forEach((_, i) => {
    keys.forEach((__, j) => (at(gram, i)[j] = at(at(gram, i), j) + scale));
    moment[i] = at(moment, i) + scale;
  });

  const solution = nonNegativeLeastSquares(gram, moment);
  const value = (name: string) =>
    extra.reduce(
      (sum, candidate, k) =>
        candidate.name === name
          ? sum + ('negative' in candidate ? -1 : 1) * at(solution, keys.length + k)
          : sum,
      0,
    );
  return roundWeights({
    attributes: Object.fromEntries(keys.map((key, k) => [key, at(solution, k)])),
    weakFoot: value('weakFoot'),
    skillMoves: value('skillMoves'),
    accelerate: value('accelerate'),
    height: value('height'),
    playStyles: value('playStyles'),
  });
}

const round2 = (value: number) => Math.round(value * 100) / 100 + 0;

/**
 * Attribute weights in steps of 0.005 that sum to exactly 1 (largest remainders, ties to the
 * earlier attribute), zero weights dropped; the other weights to 0.01.
 */
export function roundWeights(weights: GroupWeights): GroupWeights {
  const entries = Object.entries(weights.attributes);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const steps = Math.round(1 / ATTRIBUTE_STEP);
  const exact = entries.map(([key, weight]) => ({ key, units: (weight / total) * steps }));
  const units = exact.map(({ units: value }) => Math.floor(value));
  const missing = steps - units.reduce((a, b) => a + b, 0);
  exact
    .map(({ units: value }, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .slice(0, missing)
    .forEach(({ index }) => (units[index] = at(units, index) + 1));
  return {
    attributes: Object.fromEntries(
      exact.flatMap(({ key }, index) =>
        at(units, index) > 0 ? [[key, at(units, index) / steps]] : [],
      ),
    ),
    weakFoot: round2(weights.weakFoot),
    skillMoves: round2(weights.skillMoves),
    accelerate: round2(weights.accelerate),
    height: round2(weights.height),
    playStyles: round2(weights.playStyles),
  };
}

/** The rules with every group fitted, for the β with the lowest error on the rows. */
export function fitRules(
  rows: readonly CalibrationRow[],
  options: FitOptions = FIT_OPTIONS,
): TrueRatingRules {
  let best: { rules: TrueRatingRules; error: number } | null = null;
  for (const plusMultiplier of options.plusMultipliers) {
    const groups = Object.fromEntries(
      POSITION_GROUPS.map((group) => [
        group,
        fitGroup(
          group,
          rows.filter((row) => row.group === group),
          plusMultiplier,
          options.ridge,
        ),
      ]),
    ) as Record<PositionGroup, GroupWeights>;
    const rules: TrueRatingRules = {
      ...TRUE_RATING_RULES,
      groups,
      playStylePlusMultiplier: plusMultiplier,
    };
    const error = meanAbsoluteError(
      rows.map((row) => ratingFromTerms(row.terms, groups[row.group], rules)),
      rows.map((row) => row.reference),
    );
    if (best === null || error < best.error) best = { rules, error };
  }
  if (best === null) throw new Error('no PlayStyle+ multiplier to try');
  return best.rules;
}
