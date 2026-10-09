import { describe, expect, it } from 'vitest';

import futggPage from '../../data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { parseFutggDefinitionsPage } from '@fc27/data-sync';
import type { CatalogCard } from '@fc27/data-sync';
import {
  applyChemistryStyle,
  goalkeeperFaceStats,
  outfieldFaceStats,
  styleBoost,
  stylesFor,
} from './chemistry-style.js';
import { CHEMISTRY_STYLES } from './rules/chemistry-styles.js';
import type { ChemistryStyle } from './rules/chemistry-styles.js';

const [pele, , courtois] = parseFutggDefinitionsPage(futggPage).cards as [
  CatalogCard,
  CatalogCard,
  CatalogCard,
];

function style(name: string): ChemistryStyle {
  const found = CHEMISTRY_STYLES.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`no style ${name}`);
  return found;
}

// Expected values are worked out by hand from the raw fixture attributes and the
// face-stat weights: face = floor(Σ weight × attribute + 0.501), capped at 99.

describe('styleBoost', () => {
  it('gives the full boost at 3 chemistry, two thirds at 2, one third at 1, none at 0', () => {
    expect([9, 6, 3].map((boost) => styleBoost(boost, 3))).toEqual([9, 6, 3]);
    expect([9, 6, 3].map((boost) => styleBoost(boost, 2))).toEqual([6, 4, 2]);
    expect([9, 6, 3].map((boost) => styleBoost(boost, 1))).toEqual([3, 2, 1]);
    expect([9, 6, 3].map((boost) => styleBoost(boost, 0))).toEqual([0, 0, 0]);
  });
});

describe('outfieldFaceStats', () => {
  it('reproduces the face stats printed on the card', () => {
    expect(outfieldFaceStats(pele.attributes)).toEqual(pele.faceStats);
    expect(outfieldFaceStats(courtois.attributes)).toEqual(courtois.faceStats);
  });
});

describe('goalkeeperFaceStats', () => {
  it('reproduces the goalkeeper face stats printed on the card', () => {
    expect(goalkeeperFaceStats(courtois.attributes)).toEqual(courtois.goalkeeperFaceStats);
  });
});

describe('stylesFor', () => {
  it('offers the 19 outfield styles to an outfield player', () => {
    expect(stylesFor(pele).map((candidate) => candidate.name)).toEqual([
      'Basic',
      'Sniper',
      'Finisher',
      'Deadeye',
      'Marksman',
      'Hawk',
      'Artist',
      'Architect',
      'Powerhouse',
      'Maestro',
      'Engine',
      'Sentinel',
      'Guardian',
      'Gladiator',
      'Backbone',
      'Anchor',
      'Hunter',
      'Catalyst',
      'Shadow',
    ]);
  });

  it('offers the 5 goalkeeper styles to a goalkeeper', () => {
    expect(stylesFor(courtois).map((candidate) => candidate.name)).toEqual([
      'GK Basic',
      'Wall',
      'Glove',
      'Shield',
      'Cat',
    ]);
  });
});

describe('applyChemistryStyle', () => {
  it('applies the full boost at 3 chemistry, capped at 99, and recomputes the face stats', () => {
    // Hunter: acceleration +6, sprint +6, positioning +3, finishing +3, shot power +3,
    // volleys +9, penalties +6.
    const stats = applyChemistryStyle(pele, style('Hunter'), 3);

    expect(stats.attributes).toEqual({
      ...pele.attributes,
      acceleration: 99,
      sprintSpeed: 99,
      positioning: 98,
      finishing: 99,
      shotPower: 96,
      volleys: 99,
      penalties: 97,
    });
    // Shooting: .05·98 + .45·99 + .2·96 + .2·92 + .05·99 + .05·97 = 96.85 → 97.
    expect(stats.faceStats).toEqual({ ...pele.faceStats, pace: 99, shooting: 97 });
    expect(stats.goalkeeperFaceStats).toBeNull();
  });

  it('applies two thirds of the boost at 2 chemistry', () => {
    const stats = applyChemistryStyle(pele, style('Hunter'), 2);

    expect(stats.attributes).toMatchObject({
      acceleration: 97,
      sprintSpeed: 97,
      positioning: 97,
      finishing: 98,
      shotPower: 95,
      volleys: 99,
      penalties: 95,
    });
    // Shooting: .05·97 + .45·98 + .2·95 + .2·92 + .05·99 + .05·95 = 96.05 → 96.
    expect(stats.faceStats).toMatchObject({ pace: 97, shooting: 96 });
  });

  it('applies one third of the boost at 1 chemistry', () => {
    const stats = applyChemistryStyle(pele, style('Hunter'), 1);

    expect(stats.attributes).toMatchObject({
      acceleration: 95,
      sprintSpeed: 95,
      positioning: 96,
      finishing: 97,
      shotPower: 94,
      volleys: 97,
      penalties: 93,
    });
    // Shooting: .05·96 + .45·97 + .2·94 + .2·92 + .05·97 + .05·93 = 95.15 → 95.
    expect(stats.faceStats).toMatchObject({ pace: 95, shooting: 95 });
  });

  it('leaves the card unchanged at 0 chemistry', () => {
    expect(applyChemistryStyle(pele, style('Hunter'), 0)).toEqual({
      attributes: pele.attributes,
      faceStats: pele.faceStats,
      goalkeeperFaceStats: null,
    });
  });

  it('keeps the printed face stats at 0 chemistry, even where they differ from the formula', () => {
    const printed: CatalogCard = {
      ...pele,
      faceStats: { ...outfieldFaceStats(pele.attributes), pace: 50 },
    };
    expect(applyChemistryStyle(printed, style('Hunter'), 0).faceStats).toEqual(printed.faceStats);
  });

  it('boosts a goalkeeper and recomputes both sets of face stats', () => {
    // Cat: acceleration +3, GK positioning +9, GK reflexes +6.
    const stats = applyChemistryStyle(courtois, style('Cat'), 3);

    expect(stats.attributes).toEqual({
      ...courtois.attributes,
      acceleration: 45,
      gkPositioning: 99,
      gkReflexes: 96,
    });
    // Speed: .6·45 + .4·52 = 47.8 → 48; pace: .45·45 + .55·52 = 48.85 → 49.
    expect(stats.goalkeeperFaceStats).toEqual({
      ...courtois.goalkeeperFaceStats,
      reflexes: 96,
      speed: 48,
      positioning: 99,
    });
    expect(stats.faceStats).toEqual({ ...courtois.faceStats, pace: 49 });
  });

  it('refuses a goalkeeper style for an outfield player and the reverse', () => {
    expect(() => applyChemistryStyle(pele, style('Cat'), 3)).toThrow(
      'Cat is a goalkeeper style and cannot be used by a CAM',
    );
    expect(() => applyChemistryStyle(courtois, style('Hunter'), 3)).toThrow(
      'Hunter is an outfield style and cannot be used by a GK',
    );
  });
});
