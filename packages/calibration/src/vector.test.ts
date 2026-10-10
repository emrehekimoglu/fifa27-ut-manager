import { describe, expect, it } from 'vitest';

import { at, dot } from './vector.js';

describe('at', () => {
  it('reads an element and refuses an index outside the array', () => {
    expect(at([4, 5], 1)).toBe(5);
    expect(() => at([4, 5], 2)).toThrow('index 2 outside 0–1');
  });
});

describe('dot', () => {
  it('sums the pairwise products', () => {
    // 1×4 + 2×5 + 3×6 = 32.
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });
});
