import { describe, expect, it } from 'vitest';

import { syntheticCards, syntheticScores, TRUTH } from '../test/synthetic.js';
import { fitGroup, fitRules, FIT_OPTIONS, roundWeights } from './fit.js';
import { calibrationRows } from './rows.js';

const rows = syntheticCards(25).flatMap((card) => calibrationRows(card, syntheticScores(card)));

describe('fitGroup', () => {
  it('recovers the weights the references were made from', () => {
    // Without the L2 penalty the least-squares optimum is the truth itself.
    for (const group of ['GK', 'CB', 'W'] as const) {
      const members = rows.filter((row) => row.group === group);
      expect(fitGroup(group, members, 2.5, 0)).toEqual(TRUTH.groups[group]);
    }
  });

  it('shrinks the weights with the L2 penalty', () => {
    const fitted = fitGroup(
      'ST',
      rows.filter((row) => row.group === 'ST'),
      2.5,
      50,
    );
    expect(fitted.playStyles).toBeLessThan(TRUTH.groups.ST.playStyles);
    expect(Object.values(fitted.attributes).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });

  it('refuses a group without rows', () => {
    expect(() => fitGroup('CM', [], 2, 0)).toThrow('no calibration rows for CM');
  });
});

describe('fitRules', () => {
  it('fits every group and picks the PlayStyle+ multiplier that fits best', () => {
    const rules = fitRules(rows, { ridge: 0, plusMultipliers: [1, 2.5, 3] });
    expect(rules.playStylePlusMultiplier).toBe(2.5);
    expect(rules.groups).toEqual(TRUTH.groups);
    expect(rules.playStyleRelevance).toBe(TRUTH.playStyleRelevance);
  });

  it('keeps the first multiplier on a tie', () => {
    const noPlus = rows.filter((row) => row.terms.playStylesPlus === 0);
    expect(fitRules(noPlus, { ridge: 0, plusMultipliers: [3, 1] }).playStylePlusMultiplier).toBe(3);
  });

  it('needs a multiplier to try', () => {
    expect(() => fitRules(rows, { ridge: 0, plusMultipliers: [] })).toThrow(
      'no PlayStyle+ multiplier to try',
    );
  });

  it('defaults to a small penalty and the design’s multipliers', () => {
    expect(FIT_OPTIONS).toEqual({ ridge: 0.01, plusMultipliers: [1, 1.5, 2, 2.5, 3] });
  });
});

describe('roundWeights', () => {
  it('rounds attribute weights to 0.005 steps that sum to 1, largest remainders first', () => {
    // 66.66, 66.66 and 66.68 steps of 0.005: 66 each, and the 2 missing steps go to the
    // largest remainder (c) and then the earlier of the tied ones (a).
    const rounded = roundWeights({
      attributes: { finishing: 0.3333, dribbling: 0.3333, vision: 0.3334 },
      weakFoot: 0.456,
      skillMoves: -0.004,
      accelerate: -0.125,
      height: 1.234,
      playStyles: 0,
    });
    expect(rounded).toEqual({
      attributes: { finishing: 0.335, dribbling: 0.33, vision: 0.335 },
      weakFoot: 0.46,
      skillMoves: 0,
      accelerate: -0.12,
      height: 1.23,
      playStyles: 0,
    });
    expect(Object.is(rounded.skillMoves, 0)).toBe(true);
  });

  it('renormalises and drops weights that round to nothing', () => {
    // 1.998 and 0.002 of a total of 2 are 0.999 and 0.001: 199.8 and 0.2 steps, so 200 and 0.
    expect(
      roundWeights({
        attributes: { finishing: 1.998, dribbling: 0.002 },
        weakFoot: 0,
        skillMoves: 0,
        accelerate: 0,
        height: 0,
        playStyles: 0,
      }).attributes,
    ).toEqual({ finishing: 1 });
  });
});
