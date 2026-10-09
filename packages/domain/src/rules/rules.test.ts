import { describe, expect, it } from 'vitest';

import faceGains from '../../test/fixtures/futgg-chemistry-face-gains.json' with { type: 'json' };
import tacticsSlots from '../../test/fixtures/futgg-tactics-slots.json' with { type: 'json' };
import { CHEMISTRY_STYLES } from './chemistry-styles.js';
import { GOALKEEPER_FACE_WEIGHTS, OUTFIELD_FACE_WEIGHTS } from './face-stats.js';
import type { AttributeWeights } from './face-stats.js';
import { FORMATIONS } from './formations.js';

// The rules data comes from FUT.GG's site bundle (ADR-0006). These tests check it
// against what FUT.GG's pages publish independently: the slots on each tactics page
// and the face-stat gains on the chemistry styles page.

/** The card position of a slot code, e.g. RCB → CB, LS → ST. */
const SLOT_POSITIONS: Record<string, string> = {
  GK: 'GK',
  RB: 'RB',
  LB: 'LB',
  RCB: 'CB',
  CB: 'CB',
  LCB: 'CB',
  RDM: 'CDM',
  CDM: 'CDM',
  LDM: 'CDM',
  RM: 'RM',
  LM: 'LM',
  RCM: 'CM',
  CM: 'CM',
  LCM: 'CM',
  RAM: 'CAM',
  CAM: 'CAM',
  LAM: 'CAM',
  RW: 'RW',
  LW: 'LW',
  RS: 'ST',
  ST: 'ST',
  LS: 'ST',
};

describe('FORMATIONS', () => {
  it('has every formation of the FUT.GG tactics pages, with the same slots', () => {
    const bySlug = Object.fromEntries(
      FORMATIONS.map((formation) => [
        formation.name.toLowerCase().replaceAll(' ', '-'),
        formation.slots.map((slot) => slot.code),
      ]),
    );
    expect(bySlug).toEqual(tacticsSlots);
  });

  it('gives every slot the card position of its code', () => {
    for (const formation of FORMATIONS) {
      expect(formation.slots.map((slot) => slot.position)).toEqual(
        formation.slots.map((slot) => SLOT_POSITIONS[slot.code]),
      );
    }
  });

  it('identifies each formation by a distinct EA id', () => {
    expect(new Set(FORMATIONS.map((formation) => formation.id)).size).toBe(29);
  });
});

/** A style's face-stat gain at 3 chemistry, rounded to one decimal as FUT.GG shows it. */
function gain(weights: AttributeWeights, boosts: Record<string, number | undefined>): number {
  const raw = weights.reduce(
    (sum, [attribute, weight]) => sum + (boosts[attribute] ?? 0) * weight,
    0,
  );
  return Math.round(raw * 10) / 10;
}

const OUTFIELD_LABELS = {
  pace: 'Pace',
  shooting: 'Shooting',
  passing: 'Passing',
  dribbling: 'Dribbling',
  defending: 'Defending',
  physicality: 'Physicality',
} as const;
const GOALKEEPER_LABELS = {
  diving: 'Diving',
  handling: 'Handling',
  kicking: 'Kicking',
  reflexes: 'Reflexes',
  speed: 'Speed',
  positioning: 'Positioning',
} as const;

describe('CHEMISTRY_STYLES', () => {
  it('has 19 outfield and 5 goalkeeper styles with EA ids 1–24', () => {
    expect(CHEMISTRY_STYLES.map((style) => style.id)).toEqual(
      Array.from({ length: 24 }, (_, index) => index + 1),
    );
    expect(CHEMISTRY_STYLES.filter((style) => style.goalkeeper).map((style) => style.id)).toEqual([
      20, 21, 22, 23, 24,
    ]);
  });

  it('only boosts attributes by 3, 6 or 9', () => {
    const values = CHEMISTRY_STYLES.flatMap((style) => Object.values(style.boosts));
    expect(new Set(values)).toEqual(new Set([3, 6, 9]));
  });

  it('yields the face-stat gains published on the FUT.GG chemistry styles page', () => {
    const published = faceGains as Record<string, Record<string, number>>;
    const computed = Object.fromEntries(
      CHEMISTRY_STYLES.filter((style) => style.name in published).map((style) => {
        const [weights, labels] = style.goalkeeper
          ? [GOALKEEPER_FACE_WEIGHTS, GOALKEEPER_LABELS]
          : [OUTFIELD_FACE_WEIGHTS, OUTFIELD_LABELS];
        return [
          style.name,
          Object.fromEntries(
            Object.entries(labels).map(([face, label]) => [
              label,
              gain(weights[face as keyof typeof weights], style.boosts),
            ]),
          ),
        ];
      }),
    );
    expect(Object.keys(computed)).toHaveLength(22);
    expect(computed).toEqual(published);
  });
});

describe('face-stat weights', () => {
  it('sum to 1 for every face stat', () => {
    const sums = [
      ...Object.values(OUTFIELD_FACE_WEIGHTS),
      ...Object.values(GOALKEEPER_FACE_WEIGHTS),
    ].map(
      (weights) => Math.round(weights.reduce((sum, [, weight]) => sum + weight, 0) * 1000) / 1000,
    );
    expect(sums).toEqual(Array.from({ length: 12 }, () => 1));
  });
});
