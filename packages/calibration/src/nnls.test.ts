import { describe, expect, it } from 'vitest';

import { nonNegativeLeastSquares, solveLinear } from './nnls.js';

describe('solveLinear', () => {
  it('solves a square system', () => {
    // 2x + y = 3 and x + 3y = 5: x = 0.8, y = 1.4.
    const [x, y] = solveLinear(
      [
        [2, 1],
        [1, 3],
      ],
      [3, 5],
    );
    expect(x).toBeCloseTo(0.8, 12);
    expect(y).toBeCloseTo(1.4, 12);
  });

  it('pivots past a zero on the diagonal', () => {
    // y = 2 and x + y = 5.
    expect(
      solveLinear(
        [
          [0, 1],
          [1, 1],
        ],
        [2, 5],
      ),
    ).toEqual([3, 2]);
  });

  it('refuses a singular system', () => {
    expect(() =>
      solveLinear(
        [
          [1, 2],
          [2, 4],
        ],
        [1, 2],
      ),
    ).toThrow('singular matrix');
  });
});

describe('nonNegativeLeastSquares', () => {
  // A = [[1,0],[0,1],[1,1]], so AᵀA = [[2,1],[1,2]].
  const gram = [
    [2, 1],
    [1, 2],
  ];

  it('returns the unconstrained solution when it is non-negative', () => {
    // b = [1,2,3]: Aᵀb = [4,5], and [[2,1],[1,2]]x = [4,5] gives x = [1,2].
    const [x, y] = nonNegativeLeastSquares(gram, [4, 5]);
    expect(x).toBeCloseTo(1, 12);
    expect(y).toBeCloseTo(2, 12);
  });

  it('holds a variable at 0 when the unconstrained solution is negative', () => {
    // b = [2,−1,1]: unconstrained x = [2,−1]; with y = 0, x minimises 2x² − 6x: 1.5.
    expect(nonNegativeLeastSquares(gram, [3, 0])).toEqual([1.5, 0]);
  });

  it('is all zeros when every direction makes the fit worse', () => {
    expect(nonNegativeLeastSquares(gram, [-1, -2])).toEqual([0, 0]);
  });

  it('drops a variable again when a later one makes it negative', () => {
    // AᵀA and Aᵀb of A = [[1,2,1],[1,2,1],[1,0,0],[2,2,0]], b = [1,3,−2,−1]. The method first
    // takes x₂ = 0.5, then adding x₃ drives x₂ to −0.5, so x₂ leaves. The optimum is
    // x = [0,0,2]: its gradient Aᵀb − AᵀAx = [−4,−2,0] is ≤ 0 where x is 0 and 0 where x > 0.
    const solution = nonNegativeLeastSquares(
      [
        [7, 8, 2],
        [8, 12, 4],
        [2, 4, 2],
      ],
      [0, 6, 4],
    );
    expect(solution[0]).toBe(0);
    expect(solution[1]).toBe(0);
    expect(solution[2]).toBeCloseTo(2, 12);
  });
});
