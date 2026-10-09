import { describe, expect, it } from 'vitest';

import futggPage from '../../data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { parseFutggDefinitionsPage } from '@fc27/data-sync';
import type { CatalogCard } from '@fc27/data-sync';
import { CHEMISTRY_STYLES } from './rules/chemistry-styles.js';
import type { ChemistryStyle } from './rules/chemistry-styles.js';
import type { GroupWeights, TrueRatingRules } from './rules/true-rating.js';
import { bestChemistryStyle, squadTrueRating, trueRating, trueRatingTerms } from './true-rating.js';

const [pele, kubo, courtois] = parseFutggDefinitionsPage(futggPage).cards as [
  CatalogCard,
  CatalogCard,
  CatalogCard,
];

function style(name: string): ChemistryStyle {
  const found = CHEMISTRY_STYLES.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`no style ${name}`);
  return found;
}

// Small rules written for these tests, so every expected value can be worked out by hand.
// The shipped weights come from the calibration and are tested for their invariants only.
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
  playStyleRelevance: {
    0: { ST: 2, CAM: 2, W: 1 }, // Finesse Shot
    2: { ST: 1 }, // Power Shot
    39: { ST: 2 }, // Precision Header
    28: { GK: 1 }, // Far Throw
    31: { GK: 2 }, // 1v1 Close Down
    32: { GK: 2 }, // Far Reach
  },
  playStylePlusMultiplier: 2,
  playStyleCap: 3,
  rolePlusBonus: 0.5,
  rolePlusPlusBonus: 1,
  squadWeights: { GK: 1, CB: 1, FB: 1, CDM: 1, CM: 1, CAM: 1, WM: 1, W: 1, ST: 2 },
};

// Raw fixture values used below:
// Pelé: finishing 96, sprint speed 93, dribbling 94, weak foot 4, skill moves 5, Explosive,
//   173 cm, PlayStyles+ [0], PlayStyles [2, 39, 5, 16, 20, 22], Role++ False 9 at ST.
// Kubo: finishing 76, sprint speed 84, dribbling 83, weak foot 4, skill moves 4, Explosive with
//   every style, 173 cm, PlayStyles [0, 37, 38, 16, 19], Role+ Inside Forward at RW.
// Courtois: diving 87, reflexes 90, finishing 14, sprint speed 52, dribbling 13, weak foot 3,
//   skill moves 1, Lengthy, 200 cm, PlayStyles+ [31], PlayStyles [28, 32], Role++ Goalkeeper.

describe('trueRating', () => {
  it('adds weak foot, skill moves, AcceleRATE, height, PlayStyles and roles to the attributes', () => {
    // A = 0.5×96 + 0.3×93 + 0.2×94 = 94.7; weak foot 0.5×1 = 0.5; skill moves 0.3×2 = 0.6;
    // Explosive 0.6×1 = 0.6; height 0.2×(173−180)/5 = −0.28;
    // PlayStyles 0.25×(2×2 + 1 + 2) = 1.75; False 9++ 1.0. Total 98.87.
    expect(trueRating(pele, 'ST', null, 3, RULES)).toBe(98.9);
    // Kubo at RW: A = 38 + 25.2 + 16.6 = 79.8; 0.5 + 0.3 + 0.6 − 0.28;
    // Finesse Shot 0.25×1; Inside Forward+ 0.5. Total 81.67.
    expect(trueRating(kubo, 'RW', null, 3, RULES)).toBe(81.7);
  });

  it('rates the attributes after the chemistry-style boost at the player’s chemistry', () => {
    // Hunter at 3 chemistry: finishing 79, sprint speed 90. A = 39.5 + 27 + 16.6 = 83.1,
    // plus the same 1.87 of bonuses: 84.97.
    expect(trueRating(kubo, 'RW', style('Hunter'), 3, RULES)).toBe(85);
    // At 1 chemistry Hunter gives a third: finishing 77, sprint speed 86. A = 80.9; 82.77.
    expect(trueRating(kubo, 'RW', style('Hunter'), 1, RULES)).toBe(82.8);
  });

  it('uses the AcceleRATE type of the style at full chemistry', () => {
    const lengthyWithSniper: CatalogCard = {
      ...kubo,
      accelerateTypeByStyle: { Sniper: 'lengthy' },
    };
    // Sniper at 3 chemistry: finishing 79, A = 39.5 + 25.2 + 16.6 = 81.3, and Lengthy 0.6×(−1):
    // 81.3 + 0.5 + 0.3 − 0.6 − 0.28 + 0.25 + 0.5 = 81.97.
    expect(trueRating(lengthyWithSniper, 'RW', style('Sniper'), 3, RULES)).toBe(82);
    // At 2 chemistry: finishing 78, A = 80.8, and the card's own Explosive: 82.67.
    expect(trueRating(lengthyWithSniper, 'RW', style('Sniper'), 2, RULES)).toBe(82.7);
  });

  it('caps the rating at 99', () => {
    // Basic at 3 chemistry: sprint speed 96, dribbling 97. A = 48 + 28.8 + 19.4 = 96.2;
    // 96.2 + 0.5 + 0.6 + 0.6 − 0.28 + 1.75 + 1 = 100.37.
    expect(trueRating(pele, 'ST', style('Basic'), 3, RULES)).toBe(99);
  });

  it('weights a goalkeeper with the goalkeeper group, capping height and PlayStyles', () => {
    // A = 0.5×87 + 0.5×90 = 88.5; height 0.5×3 (200 cm is capped at three steps) = 1.5;
    // PlayStyles 0.5×(2×2 + 1 + 2) = 3.5, capped at 3; Goalkeeper++ 1.0. Total 94.
    expect(trueRating(courtois, 'GK', null, 3, RULES)).toBe(94);
  });

  it('rates a card at a position it does not play with that position’s weights', () => {
    // Courtois at ST: A = 7 + 15.6 + 2.6 = 25.2; skill moves 0.3×(1−3) = −0.6;
    // Lengthy 0.6×(−1) = −0.6; height 0.2×3 = 0.6; no PlayStyle or role at ST. Total 24.6.
    expect(trueRating(courtois, 'ST', null, 3, RULES)).toBe(24.6);
  });

  it('adds nothing for what the source does not report', () => {
    const bare: CatalogCard = {
      ...kubo,
      heightCm: null,
      accelerateType: null,
      accelerateTypeByStyle: null,
      playStyles: null,
      playStylesPlus: null,
      rolesPlus: null,
      rolesPlusPlus: null,
    };
    // 79.8 + weak foot 0.5 + skill moves 0.3.
    expect(trueRating(bare, 'RW', null, 3, RULES)).toBe(80.6);
  });

  it('never goes below 0', () => {
    const empty: CatalogCard = {
      ...courtois,
      attributes: { ...courtois.attributes, finishing: 0, sprintSpeed: 0, dribbling: 0 },
    };
    // 0 − 0.6 − 0.6 + 0.6 = −0.6.
    expect(trueRating(empty, 'ST', null, 3, RULES)).toBe(0);
  });

  it('counts a PlayStyle+ as a multiple of its PlayStyle', () => {
    const plusOnly: CatalogCard = { ...kubo, playStyles: [], playStylesPlus: [0] };
    // As before, but Finesse Shot+ counts 0.25×1×2 = 0.5 instead of 0.25: 81.92.
    expect(trueRating(plusOnly, 'RW', null, 3, RULES)).toBe(81.9);
  });

  it('adds the Role+ bonus only for a role at the position, and Role++ over Role+', () => {
    // Pelé has Shadow Striker++ and Playmaker+ at CAM: only the Role++ bonus counts.
    const atCam = trueRating({ ...pele, rolesPlusPlus: [] }, 'CAM', null, 0, RULES);
    const plusPlus = trueRating(pele, 'CAM', null, 0, RULES);
    expect(Math.round((plusPlus - atCam) * 10) / 10).toBe(0.5);
    // Kubo's Inside Forward+ is a RW role, so it adds nothing at LW: 81.67 − 0.5 = 81.17.
    expect(trueRating(kubo, 'LW', null, 3, RULES)).toBe(81.2);
  });
});

describe('trueRatingTerms', () => {
  it('lists the inputs the weights multiply, before any weight is applied', () => {
    // Pelé at ST: weak foot 4 − 3, skill moves 5 − 3, Explosive +1, height (173 − 180)/5;
    // PlayStyles Power Shot 1 + Precision Header 2, PlayStyle+ Finesse Shot 2; False 9++.
    expect(trueRatingTerms(pele, 'ST', null, 3, RULES)).toEqual({
      attributes: pele.attributes,
      weakFoot: 1,
      skillMoves: 2,
      accelerate: 1,
      height: -1.4,
      playStyles: 3,
      playStylesPlus: 2,
      role: 1,
    });
  });

  it('boosts the attributes with the style and caps the height steps', () => {
    const kuboTerms = trueRatingTerms(kubo, 'RW', style('Hunter'), 3, RULES);
    // Hunter at 3 chemistry: finishing 76 + 3, sprint speed 84 + 6.
    expect(kuboTerms.attributes).toMatchObject({ finishing: 79, sprintSpeed: 90 });
    expect(kuboTerms).toMatchObject({ playStyles: 1, playStylesPlus: 0, role: 0.5 });
    // Courtois: 200 cm is 4 steps, capped at 3; Lengthy −1; skill moves 1 − 3;
    // Far Throw 1 + Far Reach 2, PlayStyle+ 1v1 Close Down 2; Goalkeeper++.
    expect(trueRatingTerms(courtois, 'GK', null, 3, RULES)).toEqual({
      attributes: courtois.attributes,
      weakFoot: 0,
      skillMoves: -2,
      accelerate: -1,
      height: 3,
      playStyles: 3,
      playStylesPlus: 2,
      role: 1,
    });
  });
});

describe('bestChemistryStyle', () => {
  it('picks the style with the highest true rating at the chemistry', () => {
    // Gains 0.5×Δfinishing + 0.3×Δsprint + 0.2×Δdribbling at 3 chemistry: Finisher 6.3,
    // Marksman 3.6, Hunter 3.3, Hawk 2.4, Engine 2.1, … Kubo is Explosive with every style.
    expect(bestChemistryStyle(kubo, 'RW', 3, RULES)?.name).toBe('Finisher');
    // At 1 chemistry: Finisher 0.5×3 + 0.2×3 = 2.1, Marksman 1.2, Hunter 1.1.
    expect(bestChemistryStyle(kubo, 'RW', 1, RULES)?.name).toBe('Finisher');
  });

  it('breaks a tie with the lower style id', () => {
    // Wall (diving +9) and Shield (reflexes +9) both add 4.5 for Courtois.
    expect(bestChemistryStyle(courtois, 'GK', 3, RULES)?.name).toBe('Wall');
    // Pelé reaches the cap of 99 with Basic (id 1) and several later styles.
    expect(bestChemistryStyle(pele, 'ST', 3, RULES)?.name).toBe('Basic');
  });

  it('picks none at 0 chemistry', () => {
    expect(bestChemistryStyle(kubo, 'RW', 0, RULES)).toBeNull();
  });
});

describe('squadTrueRating', () => {
  it('averages the slots by the weight of their positions, empty slots counting 0', () => {
    const slots = [
      { position: 'GK', rating: 94 },
      { position: 'RW', rating: 81.7 },
      { position: 'ST', rating: 98.9 },
      ...(['RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'LW'] as const).map((position) => ({
        position,
        rating: null,
      })),
    ] as const;
    // (94 + 81.7 + 2×98.9) / (1 + 1 + 2 + 8) = 373.5 / 12 = 31.125.
    expect(squadTrueRating(slots, RULES)).toBe(31.1);
  });

  it('is 0 for an empty squad', () => {
    expect(squadTrueRating([{ position: 'GK', rating: null }], RULES)).toBe(0);
    expect(squadTrueRating([], RULES)).toBe(0);
  });
});
