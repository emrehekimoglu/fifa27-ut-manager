import { describe, expect, it } from 'vitest';

import futggPage from '../../../../../packages/data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { parseFutggDefinitionsPage } from '@fc27/data-sync';
import type { CatalogCard } from '@fc27/data-sync';
import { FORMATIONS, TRUE_RATING_RULES } from '@fc27/domain';
import type { GroupWeights, TrueRatingRules } from '@fc27/domain';
import {
  DEFAULT_FORMATION_ID,
  changeFormation,
  chooseStyle,
  evaluate,
  formationLabel,
  newPlayground,
  placeCard,
  removeCard,
} from './playground';

const [pele, kubo, courtois] = parseFutggDefinitionsPage(futggPage).cards as [
  CatalogCard,
  CatalogCard,
  CatalogCard,
];
const HUNTER = 17;
const SNIPER = 2;

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

const formationId = (name: string) => {
  const found = FORMATIONS.find((formation) => formation.name === name);
  if (!found) throw new Error(`no formation ${name}`);
  return found.id;
};

// 4-3-3 slots: GK, RB, RCB, LCB, LB, RCM, CM, LCM, RW, ST, LW.
const GK = 0;
const RW = 8;
const ST = 9;

/** Courtois in goal, Kubo (RM, alt RW) at RW, Pelé (CAM, alt ST) at ST. */
const trio = () =>
  placeCard(placeCard(placeCard(newPlayground(), GK, courtois), RW, kubo), ST, pele);

describe('newPlayground', () => {
  it('starts with eleven empty slots in 4-3-3', () => {
    const playground = newPlayground();
    expect(playground.formationId).toBe(DEFAULT_FORMATION_ID);
    expect(evaluate(playground).formation.name).toBe('4-3-3');
    expect(playground.slots).toEqual(
      Array.from({ length: 11 }, () => ({ card: null, styleId: 'auto' })),
    );
  });

  it('starts in the given formation', () => {
    expect(evaluate(newPlayground(formationId('4-4-2'))).formation.name).toBe('4-4-2');
  });
});

describe('evaluate', () => {
  it('rates an empty XI 0 with no chemistry', () => {
    const evaluation = evaluate(newPlayground());
    expect(evaluation.rating).toBe(0);
    expect(evaluation.trueRating).toBe(0);
    expect(evaluation.chemistry).toBe(0);
    expect(evaluation.slots[RW]).toEqual({
      code: 'RW',
      position: 'RW',
      card: null,
      styleId: 'auto',
      style: null,
      inPosition: false,
      chemistry: 0,
      stats: null,
      accelerateType: null,
      trueRating: null,
    });
  });

  it('computes chemistry and squad rating of the placed cards', () => {
    // Pelé is an icon (3) and lifts LALIGA to 3, giving Courtois and Kubo 1 each.
    // Ratings 90, 80, 95 and eight empty slots: sum 265, cf 192.73 → round(457.73) / 11 → 41.
    const evaluation = evaluate(trio());
    expect(evaluation.slots.map((slot) => slot.chemistry)).toEqual([
      1, 0, 0, 0, 0, 0, 0, 0, 1, 3, 0,
    ]);
    expect(evaluation.chemistry).toBe(5);
    expect(evaluation.rating).toBe(41);
    expect(evaluation.slots[ST]).toMatchObject({ code: 'ST', card: pele, inPosition: true });
  });

  it('shows the printed stats when the player has no chemistry style', () => {
    expect(evaluate(chooseStyle(trio(), ST, null)).slots[ST]?.stats).toEqual({
      attributes: pele.attributes,
      faceStats: pele.faceStats,
      goalkeeperFaceStats: null,
    });
  });

  it('applies the chosen chemistry style at the player’s chemistry', () => {
    // Hunter at 3 chemistry: pace 99, shooting 97 (worked out in the domain tests).
    const stats = evaluate(chooseStyle(trio(), ST, HUNTER)).slots[ST]?.stats;
    expect(stats?.faceStats).toEqual({ ...pele.faceStats, pace: 99, shooting: 97 });
  });
});

describe('evaluate AcceleRATE', () => {
  it('gives each player the AcceleRATE type of their style at their chemistry', () => {
    // Pelé (Icon) has 3 chemistry at ST; Sniper makes him Controlled, Hunter keeps Explosive.
    const sniper = evaluate(chooseStyle(trio(), ST, SNIPER)).slots[ST];
    expect(sniper?.chemistry).toBe(3);
    expect(sniper?.accelerateType).toBe('controlled');
    expect(evaluate(chooseStyle(trio(), ST, HUNTER)).slots[ST]?.accelerateType).toBe('explosive');
    expect(evaluate(chooseStyle(trio(), ST, null)).slots[ST]?.accelerateType).toBe('explosive');
    expect(evaluate(trio()).slots[GK]?.accelerateType).toBe('lengthy');
  });

  it('keeps the card’s own type below full chemistry', () => {
    // Pelé at RW is out of position, so he has 0 chemistry and Sniper does nothing.
    const outOfPosition = chooseStyle(placeCard(newPlayground(), RW, pele), RW, SNIPER);
    expect(evaluate(outOfPosition).slots[RW]?.accelerateType).toBe('explosive');
  });
});

describe('evaluate true rating', () => {
  it('picks the best chemistry style automatically at each player’s chemistry', () => {
    // Courtois (1 chemistry): Wall and Shield both add 0.5×3 = 1.5, Wall has the lower id.
    // Kubo (1 chemistry): Finisher adds 0.5×3 + 0.2×3 = 2.1. Pelé (3): Basic reaches the cap.
    const evaluation = evaluate(trio(), RULES);
    expect([GK, RW, ST].map((index) => evaluation.slots[index]?.style?.name)).toEqual([
      'Wall',
      'Finisher',
      'Basic',
    ]);
    // Wall at 1 chemistry is diving +3: 87 → 90.
    expect(evaluation.slots[GK]?.stats?.attributes.gkDiving).toBe(90);
  });

  it('rates each player at the slot’s position with the slot’s style and chemistry', () => {
    // Courtois: 94 at no style, plus Wall's 1.5 → 95.5.
    // Kubo: A = 79.8 + 2.1 = 81.9, plus 0.5 + 0.3 + 0.6 − 0.28 + 0.25 + 0.5 = 1.87 → 83.77.
    // Pelé: Basic takes him past 99, so the cap holds.
    const evaluation = evaluate(trio(), RULES);
    expect(evaluation.slots.map((slot) => slot.trueRating)).toEqual([
      95.5,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      83.8,
      99,
      null,
    ]);
  });

  it('averages the true ratings by position weight into the squad true rating', () => {
    // (95.5 + 83.8 + 2×99) / (10 × 1 + 2) = 377.3 / 12 = 31.44.
    expect(evaluate(trio(), RULES).trueRating).toBe(31.4);
  });

  it('uses a style chosen by hand instead of the automatic one', () => {
    // Kubo with Hunter at 1 chemistry: finishing 77, sprint speed 86. A = 80.9; 82.77.
    const kuboSlot = evaluate(chooseStyle(trio(), RW, HUNTER), RULES).slots[RW];
    expect(kuboSlot?.style?.name).toBe('Hunter');
    expect(kuboSlot?.trueRating).toBe(82.8);
    // With no style: 79.8 + 1.87 = 81.67.
    expect(evaluate(chooseStyle(trio(), RW, null), RULES).slots[RW]?.trueRating).toBe(81.7);
  });

  it('has no automatic style at 0 chemistry and rates the player out of position', () => {
    // In 4-4-2 Kubo sits at LM with 0 chemistry. No PlayStyle or role of his counts there:
    // 79.8 + 0.5 + 0.3 + 0.6 − 0.28 = 80.92.
    const kuboSlot = evaluate(changeFormation(trio(), formationId('4-4-2')), RULES).slots[8];
    expect(kuboSlot?.styleId).toBe('auto');
    expect(kuboSlot?.style).toBeNull();
    expect(kuboSlot?.trueRating).toBe(80.9);
  });

  it('uses the shipped weights by default', () => {
    expect(evaluate(trio())).toEqual(evaluate(trio(), TRUE_RATING_RULES));
  });
});

describe('placeCard', () => {
  it('replaces the card of a slot and picks its chemistry style automatically', () => {
    const playground = placeCard(chooseStyle(trio(), ST, HUNTER), ST, kubo);
    expect(playground.slots[ST]).toEqual({ card: kubo, styleId: 'auto' });
  });
});

describe('removeCard', () => {
  it('empties the slot', () => {
    const playground = removeCard(chooseStyle(trio(), ST, HUNTER), ST);
    expect(playground.slots[ST]).toEqual({ card: null, styleId: 'auto' });
    expect(evaluate(playground).chemistry).toBe(0);
  });
});

describe('chooseStyle', () => {
  it('sets, clears and restores the automatic chemistry style of one slot', () => {
    const styled = chooseStyle(trio(), ST, HUNTER);
    expect(styled.slots.map((slot) => slot.styleId)).toEqual([
      'auto',
      'auto',
      'auto',
      'auto',
      'auto',
      'auto',
      'auto',
      'auto',
      'auto',
      HUNTER,
      'auto',
    ]);
    expect(chooseStyle(styled, ST, null).slots[ST]?.styleId).toBeNull();
    expect(chooseStyle(styled, ST, 'auto').slots[ST]?.styleId).toBe('auto');
  });
});

describe('changeFormation', () => {
  it('keeps every card in its slot number, out of position where it no longer fits', () => {
    // In 4-4-2 slot 8 is LM, which Kubo (RM, RW) cannot play; slot 9 is RS, which Pelé can.
    const evaluation = evaluate(
      changeFormation(chooseStyle(trio(), ST, HUNTER), formationId('4-4-2')),
    );

    expect(evaluation.formation.name).toBe('4-4-2');
    expect(evaluation.slots[8]).toMatchObject({
      code: 'LM',
      card: kubo,
      inPosition: false,
      chemistry: 0,
    });
    expect(evaluation.slots[9]).toMatchObject({
      code: 'RS',
      card: pele,
      styleId: HUNTER,
      chemistry: 3,
    });
    // Without Kubo, LALIGA counts Courtois plus Pelé's +1: 2, below the threshold.
    expect(evaluation.slots[GK]?.chemistry).toBe(0);
    expect(evaluation.chemistry).toBe(3);
  });
});

describe('unknown formations', () => {
  it('are refused when starting or switching', () => {
    expect(() => newPlayground(999)).toThrow('Unknown formation 999');
    expect(() => changeFormation(newPlayground(), 999)).toThrow('Unknown formation 999');
  });
});

describe('formationLabel', () => {
  it('translates the variant names into Turkish', () => {
    expect(
      [
        '4-3-3',
        '4-3-3 Attack',
        '4-3-3 Defend',
        '4-3-3 Holding',
        '4-2-3-1 Wide',
        '4-1-2-1-2 Narrow',
        '4-5-1 Flat',
      ].map(formationLabel),
    ).toEqual([
      '4-3-3',
      '4-3-3 Hücum',
      '4-3-3 Savunma',
      '4-3-3 Tutucu',
      '4-2-3-1 Geniş',
      '4-1-2-1-2 Dar',
      '4-5-1 Düz',
    ]);
  });
});
