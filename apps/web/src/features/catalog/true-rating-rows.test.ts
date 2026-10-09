import { describe, expect, it } from 'vitest';

import futggPage from '../../../../../packages/data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { parseFutggDefinitionsPage } from '@fc27/data-sync';
import type { CatalogCard } from '@fc27/data-sync';
import type { GroupWeights, TrueRatingRules } from '@fc27/domain';
import { formatTrueRating, trueRatingRows } from './true-rating-rows';

const [, kubo, courtois] = parseFutggDefinitionsPage(futggPage).cards as [
  CatalogCard,
  CatalogCard,
  CatalogCard,
];

// The same small rules as the domain's true-rating tests, so the values can be worked out by hand.
const OUTFIELD: GroupWeights = {
  attributes: { finishing: 0.5, sprintSpeed: 0.3, dribbling: 0.2 },
  weakFoot: 0.5,
  skillMoves: 0.3,
  accelerate: 0.6,
  height: 0.2,
  playStyles: 0.25,
};
const RULES: TrueRatingRules = {
  groups: {
    GK: {
      attributes: { gkDiving: 0.5, gkReflexes: 0.5 },
      weakFoot: 0,
      skillMoves: 0,
      accelerate: 0,
      height: 0.5,
      playStyles: 0.5,
    },
    CB: OUTFIELD,
    FB: OUTFIELD,
    CDM: OUTFIELD,
    CM: OUTFIELD,
    CAM: OUTFIELD,
    WM: OUTFIELD,
    W: OUTFIELD,
    ST: OUTFIELD,
  },
  playStyleRelevance: { 0: { W: 1 }, 28: { GK: 1 }, 31: { GK: 2 }, 32: { GK: 2 } },
  playStylePlusMultiplier: 2,
  playStyleCap: 3,
  rolePlusBonus: 0.5,
  rolePlusPlusBonus: 1,
  squadWeights: { GK: 1, CB: 1, FB: 1, CDM: 1, CM: 1, CAM: 1, WM: 1, W: 1, ST: 1 },
};

describe('trueRatingRows', () => {
  it('rates the card at each position it plays, with its best style at full chemistry', () => {
    // Kubo (RM, alt RW): A = 0.5×76 + 0.3×84 + 0.2×83 = 79.8; weak foot 0.5, skill moves 0.3,
    // Explosive 0.6, height −0.28. Finisher adds the most: 0.5×9 + 0.2×9 = 6.3.
    // RM: no PlayStyle counts, Winger+ 0.5 → 87.72. RW: Finesse Shot 0.25, Inside Forward+ 0.5
    // → 87.97.
    expect(trueRatingRows(kubo, RULES)).toEqual([
      { position: 'RM', rating: '87,7', style: 'Finisher' },
      { position: 'RW', rating: '88,0', style: 'Finisher' },
    ]);
  });

  it('rates a goalkeeper with the goalkeeper styles', () => {
    // A = 88.5; Wall +4.5 (ties Shield, lower id); height 1.5; PlayStyles 3 (capped);
    // Goalkeeper++ 1 → 98.5.
    expect(trueRatingRows(courtois, RULES)).toEqual([
      { position: 'GK', rating: '98,5', style: 'Wall' },
    ]);
  });
});

describe('formatTrueRating', () => {
  it('shows one decimal with a decimal comma', () => {
    expect(formatTrueRating(87.7)).toBe('87,7');
    expect(formatTrueRating(88)).toBe('88,0');
    expect(formatTrueRating(0)).toBe('0,0');
    expect(formatTrueRating(99)).toBe('99,0');
  });
});
