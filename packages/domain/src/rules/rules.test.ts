import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import faceGains from '../../test/fixtures/futgg-chemistry-face-gains.json' with { type: 'json' };
import futggPlayStyles from '../../test/fixtures/futgg-playstyles.json' with { type: 'json' };
import futggRoles from '../../test/fixtures/futgg-roles.json' with { type: 'json' };
import tacticsSlots from '../../test/fixtures/futgg-tactics-slots.json' with { type: 'json' };
import { CHEMISTRY_STYLES } from './chemistry-styles.js';
import { GOALKEEPER_FACE_WEIGHTS, OUTFIELD_FACE_WEIGHTS } from './face-stats.js';
import type { AttributeWeights } from './face-stats.js';
import { FORMATIONS } from './formations.js';
import { PLAYSTYLES } from './playstyles.js';
import { ROLES } from './roles.js';
import { POSITION_GROUPS, TRUE_RATING_RULES } from './true-rating.js';

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
    expect(Object.keys(computed)).toHaveLength(24);
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

describe('PLAYSTYLES', () => {
  it('has every PlayStyle of the FUT.GG PlayStyle list, with the same EA id, name and category', () => {
    expect(PLAYSTYLES.map(({ id, name, category }) => ({ eaId: id, name, category }))).toEqual(
      futggPlayStyles,
    );
  });

  it('identifies each PlayStyle by a distinct EA id', () => {
    expect(new Set(PLAYSTYLES.map((playStyle) => playStyle.id)).size).toBe(36);
  });
});

describe('ROLES', () => {
  it('has every role of the FUT.GG role list, with the same position and Role+/Role++ ids', () => {
    expect(
      ROLES.map(({ name, position, plusId, plusPlusId }) => ({
        name,
        positionName: position,
        plusEaId: plusId,
        plusPlusEaId: plusPlusId,
      })),
    ).toEqual(futggRoles);
  });

  it('identifies each Role+ and Role++ by a distinct EA id', () => {
    const ids = ROLES.flatMap((role) => [role.plusId, role.plusPlusId]);
    expect(new Set(ids).size).toBe(98);
  });
});

/** The PlayStyle relevance table of the approved design, docs/domain/true-rating.md §2.5. */
function designRelevance(): Record<number, Record<string, number>> {
  const design = readFileSync(
    new URL('../../../../docs/domain/true-rating.md', import.meta.url),
    'utf8',
  );
  const rows = design.split('\n').filter((line) => /^\| [^|]+ \(\d+\) +\|/.test(line));
  return Object.fromEntries(
    rows.map((line) => {
      const [label = '', ...cells] = line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim());
      const id = Number(/\((\d+)\)$/.exec(label)?.[1]);
      const relevance = Object.fromEntries(
        POSITION_GROUPS.map((group, index): [string, number] => [
          group,
          Number(cells[index]),
        ]).filter(([, value]) => value !== 0),
      );
      return [id, relevance];
    }),
  );
}

describe('TRUE_RATING_RULES', () => {
  it('has the PlayStyle relevance table of the approved design for all 36 PlayStyles', () => {
    const design = designRelevance();
    expect(Object.keys(design)).toHaveLength(36);
    expect(TRUE_RATING_RULES.playStyleRelevance).toEqual(design);
  });

  it('has the fixed values of the approved design', () => {
    expect(TRUE_RATING_RULES.playStyleCap).toBe(6);
    expect(TRUE_RATING_RULES.rolePlusBonus).toBe(0.5);
    expect(TRUE_RATING_RULES.rolePlusPlusBonus).toBe(1);
    expect(Object.values(TRUE_RATING_RULES.squadWeights)).toEqual(POSITION_GROUPS.map(() => 1));
  });

  it('weights each group’s attributes with non-negative weights summing to 1', () => {
    for (const group of POSITION_GROUPS) {
      const weights = Object.values(TRUE_RATING_RULES.groups[group].attributes);
      expect(weights.every((weight) => weight >= 0)).toBe(true);
      expect(Math.round(weights.reduce((sum, weight) => sum + weight, 0) * 1e6) / 1e6).toBe(1);
    }
  });

  it('never takes points away for more weak-foot or skill-move stars or PlayStyles', () => {
    for (const group of POSITION_GROUPS) {
      const { weakFoot, skillMoves, playStyles } = TRUE_RATING_RULES.groups[group];
      expect([weakFoot, skillMoves, playStyles].every((value) => value >= 0)).toBe(true);
    }
    expect(TRUE_RATING_RULES.groups.GK.skillMoves).toBe(0);
    expect(TRUE_RATING_RULES.playStylePlusMultiplier).toBeGreaterThanOrEqual(1);
  });
});
