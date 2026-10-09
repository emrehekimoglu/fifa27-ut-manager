import { describe, expect, it } from 'vitest';

import { squadRating } from './squad-rating.js';

// Expected values are worked out by hand with the formula of PRD §7.2:
// sum, avg = sum / 11, cf = Σ max(0, rating − avg), rating = floor(round(sum + cf) / 11).

describe('squadRating', () => {
  it('equals the rating of a squad of equal players', () => {
    expect(squadRating(Array.from({ length: 11 }, () => 85))).toBe(85);
  });

  it('weights players above the average more than a plain average does', () => {
    // sum 928, avg 84.36, cf 14.18 → round(942.18) = 942 → 942 / 11 = 85.6; plain average 84.4.
    expect(squadRating([90, 88, 87, 86, 85, 84, 84, 83, 82, 80, 79])).toBe(85);
  });

  it('rounds the corrected sum before dividing', () => {
    // sum 948, avg 86.18, cf 19.91 → round(967.91) = 968 = 88 × 11; without rounding 87.
    expect(squadRating([91, 91, 90, 90, 88, 87, 86, 86, 80, 80, 79])).toBe(88);
  });

  it('counts an empty slot as 0', () => {
    // sum 850, avg 77.27, cf 77.27 → round(927.27) = 927 → 927 / 11 = 84.3.
    expect(squadRating([85, 85, 85, 85, 85, null, 85, 85, 85, 85, 85])).toBe(84);
  });

  it('is 0 for an empty squad', () => {
    expect(squadRating(Array.from({ length: 11 }, () => null))).toBe(0);
  });

  it('needs exactly the eleven starters', () => {
    expect(() => squadRating([85, 85])).toThrow('A squad rating needs 11 starters, got 2');
  });
});
