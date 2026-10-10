import { describe, expect, it } from 'vitest';

import { isHeldOut, meanAbsoluteError, ranks, spearman } from './metrics.js';

describe('meanAbsoluteError', () => {
  it('averages the absolute differences', () => {
    // |1−2| + |2−2| + |4−1| = 4 over 3 pairs.
    expect(meanAbsoluteError([1, 2, 4], [2, 2, 1])).toBe(4 / 3);
  });

  it('is 0 for no pairs', () => {
    expect(meanAbsoluteError([], [])).toBe(0);
  });
});

describe('ranks', () => {
  it('ranks from 1, sharing the mean rank among ties', () => {
    expect(ranks([10, 20, 20, 5])).toEqual([2, 3.5, 3.5, 1]);
    expect(ranks([7, 7, 7])).toEqual([2, 2, 2]);
  });
});

describe('spearman', () => {
  it('is 1 for the same order and −1 for the reverse', () => {
    expect(spearman([1, 2, 3], [10, 40, 90])).toBe(1);
    expect(spearman([1, 2, 3], [9, 4, 1])).toBe(-1);
  });

  it('measures how far the orders agree', () => {
    // Two adjacent ranks swapped: 1 − 6×(1² + 1²)/(4×(4² − 1)) = 0.8.
    expect(spearman([1, 2, 3, 4], [1, 3, 2, 4])).toBeCloseTo(0.8, 12);
  });

  it('is 0 when either side does not vary', () => {
    expect(spearman([1, 2, 3], [5, 5, 5])).toBe(0);
    expect(spearman([5, 5, 5], [1, 2, 3])).toBe(0);
  });
});

describe('isHeldOut', () => {
  it('holds out the cards whose hashed EA id falls in the lowest fifth', () => {
    // 1 × 2654435761 = 2654435761 ≥ 2³²/5 = 858993459.2: kept for fitting.
    expect(isHeldOut(1)).toBe(false);
    // 5 × 2654435761 mod 2³² = 387276917 < 858993459.2: held out.
    expect(isHeldOut(5)).toBe(true);
  });

  it('holds out one card in five', () => {
    // Multiplying by 2³²/φ spreads consecutive ids evenly, so exactly a fifth of 1–1000.
    const ids = Array.from({ length: 1000 }, (_, index) => index + 1);
    expect(ids.filter(isHeldOut)).toHaveLength(200);
  });
});
