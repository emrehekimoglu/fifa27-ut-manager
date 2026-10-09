import { describe, expect, it } from 'vitest';

import futggPage from '../../data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { parseFutggDefinitionsPage } from '@fc27/data-sync';
import type { CatalogCard } from '@fc27/data-sync';
import { cardPlayStyles, cardRoles } from './card-traits.js';

const [pele, kubo, courtois] = parseFutggDefinitionsPage(futggPage).cards as [
  CatalogCard,
  CatalogCard,
  CatalogCard,
];

// Expected names are looked up by hand in FUT.GG's PlayStyle and role lists
// (test/fixtures/futgg-playstyles.json and futgg-roles.json) from the raw card ids.

describe('cardPlayStyles', () => {
  it('names the PlayStyles+ first, then the PlayStyles, in the order of the card', () => {
    // Pelé: playstylesPlus [0], playstyles [2, 39, 5, 16, 20, 22].
    expect(cardPlayStyles(pele)).toEqual([
      { id: 0, name: 'Finesse Shot', plus: true },
      { id: 2, name: 'Power Shot', plus: false },
      { id: 39, name: 'Precision Header', plus: false },
      { id: 5, name: 'Incisive Pass', plus: false },
      { id: 16, name: 'Technical', plus: false },
      { id: 20, name: 'Trickster', plus: false },
      { id: 22, name: 'Quick Step', plus: false },
    ]);
  });

  it('names goalkeeper PlayStyles', () => {
    // Courtois: playstylesPlus [31], playstyles [28, 32].
    expect(cardPlayStyles(courtois)).toEqual([
      { id: 31, name: '1v1 Close Down', plus: true },
      { id: 28, name: 'Far Throw', plus: false },
      { id: 32, name: 'Far Reach', plus: false },
    ]);
  });

  it('keeps an id the rules data does not know, without a name', () => {
    expect(cardPlayStyles({ playStyles: [99], playStylesPlus: [16] })).toEqual([
      { id: 16, name: 'Technical', plus: true },
      { id: 99, name: null, plus: false },
    ]);
  });

  it('reads a list the source leaves out as empty when it reports the other', () => {
    expect(cardPlayStyles({ playStyles: [16], playStylesPlus: null })).toEqual([
      { id: 16, name: 'Technical', plus: false },
    ]);
    expect(cardPlayStyles({ playStyles: null, playStylesPlus: [17] })).toEqual([
      { id: 17, name: 'Rapid', plus: true },
    ]);
  });

  it('is null when the source reports no PlayStyles at all', () => {
    expect(cardPlayStyles({ playStyles: null, playStylesPlus: null })).toBeNull();
  });

  it('is empty for a card without PlayStyles', () => {
    expect(cardPlayStyles({ playStyles: [], playStylesPlus: [] })).toEqual([]);
  });
});

describe('cardRoles', () => {
  it('names the Role++ first, then the Role+, with their positions', () => {
    // Pelé: rolesPlusPlus [132, 143], rolesPlus [31].
    expect(cardRoles(pele)).toEqual([
      { id: 132, position: 'CAM', name: 'Shadow Striker', plusPlus: true },
      { id: 143, position: 'ST', name: 'False 9', plusPlus: true },
      { id: 31, position: 'CAM', name: 'Playmaker', plusPlus: false },
    ]);
  });

  it('keeps only the roles of a position when one is given', () => {
    expect(cardRoles(pele, 'ST')).toEqual([
      { id: 143, position: 'ST', name: 'False 9', plusPlus: true },
    ]);
    expect(cardRoles(pele, 'CB')).toEqual([]);
    // Kubo: rolesPlus [23, 25, 36] are RM Winger, RM Wide Playmaker and RW Inside Forward.
    expect(cardRoles(kubo, 'RM')).toEqual([
      { id: 23, position: 'RM', name: 'Winger', plusPlus: false },
      { id: 25, position: 'RM', name: 'Wide Playmaker', plusPlus: false },
    ]);
    expect(cardRoles(kubo, 'RW')).toEqual([
      { id: 36, position: 'RW', name: 'Inside Forward', plusPlus: false },
    ]);
  });

  it('names a goalkeeper role', () => {
    // Courtois: rolesPlusPlus [101] is the Goalkeeper role.
    expect(cardRoles(courtois)).toEqual([
      { id: 101, position: 'GK', name: 'Goalkeeper', plusPlus: true },
    ]);
  });

  it('does not take a Role+ id for a Role++ or the reverse', () => {
    // 101 is Goalkeeper++ and 1 is Goalkeeper+; neither is valid in the other list.
    expect(cardRoles({ rolesPlus: [101], rolesPlusPlus: [1] })).toEqual([
      { id: 1, position: null, name: null, plusPlus: true },
      { id: 101, position: null, name: null, plusPlus: false },
    ]);
  });

  it('leaves an unknown id out when a position is given', () => {
    expect(cardRoles({ rolesPlus: [999, 31], rolesPlusPlus: [] }, 'CAM')).toEqual([
      { id: 31, position: 'CAM', name: 'Playmaker', plusPlus: false },
    ]);
  });

  it('reads a list the source leaves out as empty when it reports the other', () => {
    expect(cardRoles({ rolesPlus: [31], rolesPlusPlus: null })).toEqual([
      { id: 31, position: 'CAM', name: 'Playmaker', plusPlus: false },
    ]);
    expect(cardRoles({ rolesPlus: null, rolesPlusPlus: [101] })).toEqual([
      { id: 101, position: 'GK', name: 'Goalkeeper', plusPlus: true },
    ]);
  });

  it('is null when the source reports no roles at all', () => {
    expect(cardRoles({ rolesPlus: null, rolesPlusPlus: null })).toBeNull();
    expect(cardRoles({ rolesPlus: null, rolesPlusPlus: null }, 'GK')).toBeNull();
  });
});
