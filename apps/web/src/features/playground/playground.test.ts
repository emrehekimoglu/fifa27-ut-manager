import { describe, expect, it } from 'vitest';

import futggPage from '../../../../../packages/data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { parseFutggDefinitionsPage } from '@fc27/data-sync';
import type { CatalogCard } from '@fc27/data-sync';
import { FORMATIONS } from '@fc27/domain';
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
      Array.from({ length: 11 }, () => ({ card: null, styleId: null })),
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
    expect(evaluation.chemistry).toBe(0);
    expect(evaluation.slots[RW]).toEqual({
      code: 'RW',
      position: 'RW',
      card: null,
      styleId: null,
      inPosition: false,
      chemistry: 0,
      stats: null,
      accelerateType: null,
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

  it('shows the printed stats while no chemistry style is chosen', () => {
    expect(evaluate(trio()).slots[ST]?.stats).toEqual({
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
    expect(evaluate(trio()).slots[ST]?.accelerateType).toBe('explosive');
    expect(evaluate(trio()).slots[GK]?.accelerateType).toBe('lengthy');
  });

  it('keeps the card’s own type below full chemistry', () => {
    // Pelé at RW is out of position, so he has 0 chemistry and Sniper does nothing.
    const outOfPosition = chooseStyle(placeCard(newPlayground(), RW, pele), RW, SNIPER);
    expect(evaluate(outOfPosition).slots[RW]?.accelerateType).toBe('explosive');
  });
});

describe('placeCard', () => {
  it('replaces the card of a slot and clears its chemistry style', () => {
    const playground = placeCard(chooseStyle(trio(), ST, HUNTER), ST, kubo);
    expect(playground.slots[ST]).toEqual({ card: kubo, styleId: null });
  });
});

describe('removeCard', () => {
  it('empties the slot', () => {
    const playground = removeCard(chooseStyle(trio(), ST, HUNTER), ST);
    expect(playground.slots[ST]).toEqual({ card: null, styleId: null });
    expect(evaluate(playground).chemistry).toBe(0);
  });
});

describe('chooseStyle', () => {
  it('sets and clears the chemistry style of one slot', () => {
    const styled = chooseStyle(trio(), ST, HUNTER);
    expect(styled.slots.map((slot) => slot.styleId)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      HUNTER,
      null,
    ]);
    expect(chooseStyle(styled, ST, null).slots[ST]?.styleId).toBeNull();
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
