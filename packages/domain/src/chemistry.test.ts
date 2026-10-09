import { describe, expect, it } from 'vitest';

import heroPage from '../../data-sync/test/fixtures/futgg-definitions-hero-page.json' with { type: 'json' };
import futggPage from '../../data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { parseFutggDefinitionsPage } from '@fc27/data-sync';
import type { CatalogCard, Position } from '@fc27/data-sync';
import { canPlay, chemistryPoints, squadChemistry } from './chemistry.js';
import { FORMATIONS } from './rules/formations.js';
import type { Formation } from './rules/formations.js';

const [pele, kubo] = parseFutggDefinitionsPage(futggPage).cards as [CatalogCard, CatalogCard];
const [kohler] = parseFutggDefinitionsPage(heroPage).cards as [CatalogCard];

function formation(name: string): Formation {
  const found = FORMATIONS.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`no formation ${name}`);
  return found;
}

/** A regular card (built from Kubo) with the given position and affiliations. */
function player(
  position: Position,
  club: number,
  league: number,
  nation: number,
  alternatePositions: readonly Position[] = [],
): CatalogCard {
  return {
    ...kubo,
    eaId: 1000 + club * 100 + nation,
    position,
    alternatePositions,
    club: { eaId: club, name: `Club ${club}` },
    league: { eaId: league, name: `League ${league}` },
    nation: { eaId: nation, name: `Nation ${nation}` },
  };
}

// 4-4-2 slots: GK, RB, RCB, LCB, LB, RM, RCM, LCM, LM, RS, LS.
// Clubs 1–9, leagues 1–6, nations 1–8; the expected chemistry is worked out by hand
// from the thresholds club 2/4/7, league 3/5/8, nation 2/5/8 (PRD §7.1).
const XI: CatalogCard[] = [
  player('GK', 1, 1, 1), //   club 1 ×2 → 1, league 1 ×3 → 1, nation 1 ×2 → 1  = 3
  player('RB', 1, 1, 2), //   1 + 1 + 0 = 2
  player('CB', 2, 1, 3), //   0 + 1 + 0 = 1
  player('CB', 3, 2, 1), //   0 + 0 (league 2 ×2) + 1 = 1
  player('LB', 4, 2, 4), //   0
  player('RM', 5, 3, 5), //   club 5 ×2 → 1, league 3 ×3 → 1, nation 5 ×2 → 1 = 3
  player('CM', 5, 3, 5), //   3
  player('CM', 6, 3, 6), //   0 + 1 + 0 = 1
  player('LM', 7, 4, 7), //   0
  player('ST', 8, 5, 8), //   0 + 0 + nation 8 ×2 → 1 = 1
  player('ST', 9, 6, 8), //   1
];
const XI_CHEMISTRY = [3, 2, 1, 1, 0, 3, 3, 1, 0, 1, 1];

const replaced = (index: number, card: CatalogCard | null) =>
  XI.map((starter, at) => (at === index ? card : starter));

describe('chemistryPoints', () => {
  it('awards club points at 2, 4 and 7 players', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((count) => chemistryPoints('club', count))).toEqual([
      0, 1, 1, 2, 2, 2, 3, 3,
    ]);
  });

  it('awards league points at 3, 5 and 8 players', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map((count) => chemistryPoints('league', count))).toEqual([
      0, 0, 1, 1, 2, 2, 2, 3, 3,
    ]);
  });

  it('awards nation points at 2, 5 and 8 players', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map((count) => chemistryPoints('nation', count))).toEqual([
      0, 1, 1, 1, 2, 2, 2, 3, 3,
    ]);
  });
});

describe('canPlay', () => {
  it('accepts the primary and every alternate position, nothing else', () => {
    expect(canPlay(kubo, 'RM')).toBe(true);
    expect(canPlay(kubo, 'RW')).toBe(true);
    expect(canPlay(kubo, 'LM')).toBe(false);
  });
});

describe('squadChemistry', () => {
  it('adds up club, league and nation points per player', () => {
    expect(squadChemistry(formation('4-4-2'), XI)).toEqual({
      players: XI_CHEMISTRY,
      total: 16,
    });
  });

  it('gives a player out of position no chemistry and does not count him', () => {
    // The RM cannot play RM: club 5, league 3 and nation 5 lose a member.
    const outOfPosition = replaced(5, player('CB', 5, 3, 5));
    expect(squadChemistry(formation('4-4-2'), outOfPosition)).toEqual({
      players: [3, 2, 1, 1, 0, 0, 0, 0, 0, 1, 1],
      total: 9,
    });
  });

  it('counts a player in an alternate position', () => {
    const alternate = replaced(5, player('CB', 5, 3, 5, ['RM']));
    expect(squadChemistry(formation('4-4-2'), alternate).total).toBe(16);
  });

  it('counts the manager toward his nation and league', () => {
    // Nation 2 reaches 2 (RB +1); league 2 reaches 3 (the CB and LB +1 each).
    expect(squadChemistry(formation('4-4-2'), XI, { nationEaId: 2, leagueEaId: 2 })).toEqual({
      players: [3, 3, 1, 2, 1, 3, 3, 1, 0, 1, 1],
      total: 19,
    });
  });

  it('leaves empty slots at 0 and does not count them', () => {
    // Without the RB, club 1 and league 1 fall below their thresholds.
    expect(squadChemistry(formation('4-4-2'), replaced(1, null))).toEqual({
      players: [1, 0, 0, 1, 0, 3, 3, 1, 0, 1, 1],
      total: 11,
    });
  });

  it('gives an icon full chemistry and counts it toward every league', () => {
    // Pelé (ICON, league Icons, Brazil) up front as ST: leagues 2 and 3 reach 3 and 4.
    const withIcon = replaced(10, { ...pele, position: 'ST' });
    expect(squadChemistry(formation('4-4-2'), withIcon)).toEqual({
      players: [3, 2, 1, 2, 1, 3, 3, 1, 0, 0, 3],
      total: 19,
    });
  });

  it('gives a hero full chemistry without a club and counts it once toward league and nation', () => {
    // Kohler (no club, Bundesliga, Germany) at RCB, in league 1 and nation 1 of the XI.
    const hero: CatalogCard = {
      ...kohler,
      league: { eaId: 1, name: 'League 1' },
      nation: { eaId: 1, name: 'Nation 1' },
    };
    expect(squadChemistry(formation('4-4-2'), replaced(2, hero))).toEqual({
      players: [3, 2, 3, 1, 0, 3, 3, 1, 0, 1, 1],
      total: 18,
    });
  });

  it('matches leagues by name when the source has no league id', () => {
    // The first three share league 1; renamed to Liga X, Liga X and Liga Y, league 1 splits.
    const unnamed = XI.map((card, at) =>
      at < 3 ? { ...card, league: { eaId: null, name: at < 2 ? 'Liga X' : 'Liga Y' } } : card,
    );
    expect(squadChemistry(formation('4-4-2'), unnamed).players.slice(0, 3)).toEqual([2, 1, 0]);
  });

  it('needs one entry per formation slot', () => {
    expect(() => squadChemistry(formation('4-4-2'), XI.slice(0, 10))).toThrow(
      'The 4-4-2 formation has 11 slots, got 10 starters',
    );
  });
});
