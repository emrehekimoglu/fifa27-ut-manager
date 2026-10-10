import { describe, expect, it } from 'vitest';

import futggPage from '../../../../../packages/data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { ACCELERATE_TYPES, POSITIONS, parseFutggDefinitionsPage } from '@fc27/data-sync';
import type { CatalogCard } from '@fc27/data-sync';
import {
  accelerateByStyle,
  accelerateLabel,
  footLabel,
  playStylesLabel,
  positionName,
  rolesLabel,
  statGroups,
} from './card-labels';

const [pele, kubo, courtois] = parseFutggDefinitionsPage(futggPage).cards as [
  CatalogCard,
  CatalogCard,
  CatalogCard,
];

// Expected values are read from the raw fixture (facePace, attributeAcceleration, …).

describe('statGroups', () => {
  it('groups an outfield card into its six face stats with their attributes', () => {
    expect(statGroups(pele)).toEqual([
      {
        label: 'Hız',
        value: 93,
        attributes: [
          { label: 'Hızlanma', value: 93 },
          { label: 'Sprint hızı', value: 93 },
        ],
      },
      {
        label: 'Şut',
        value: 94,
        attributes: [
          { label: 'Pozisyon alma', value: 95 },
          { label: 'Bitiricilik', value: 96 },
          { label: 'Şut gücü', value: 93 },
          { label: 'Uzaktan şut', value: 92 },
          { label: 'Vole', value: 94 },
          { label: 'Penaltı', value: 91 },
        ],
      },
      {
        label: 'Pas',
        value: 91,
        attributes: [
          { label: 'Vizyon', value: 95 },
          { label: 'Orta', value: 88 },
          { label: 'Serbest vuruş', value: 87 },
          { label: 'Kısa pas', value: 94 },
          { label: 'Uzun pas', value: 86 },
          { label: 'Falso', value: 87 },
        ],
      },
      {
        label: 'Dripling',
        value: 94,
        attributes: [
          { label: 'Çeviklik', value: 92 },
          { label: 'Denge', value: 91 },
          { label: 'Reaksiyon', value: 96 },
          { label: 'Top kontrolü', value: 95 },
          { label: 'Dripling', value: 94 },
          { label: 'Soğukkanlılık', value: 96 },
        ],
      },
      {
        label: 'Defans',
        value: 58,
        attributes: [
          { label: 'Top kapma', value: 65 },
          { label: 'Kafa isabeti', value: 92 },
          { label: 'Defansif farkındalık', value: 54 },
          { label: 'Ayakta müdahale', value: 50 },
          { label: 'Kayarak müdahale', value: 47 },
        ],
      },
      {
        label: 'Fizik',
        value: 74,
        attributes: [
          { label: 'Zıplama', value: 86 },
          { label: 'Dayanıklılık', value: 85 },
          { label: 'Güç', value: 74 },
          { label: 'Agresiflik', value: 57 },
        ],
      },
    ]);
  });

  it('groups a goalkeeper into the six goalkeeper face stats', () => {
    expect(statGroups(courtois)).toEqual([
      { label: 'Plonjon', value: 87, attributes: [{ label: 'Plonjon', value: 87 }] },
      { label: 'Elle kontrol', value: 89, attributes: [{ label: 'Elle kontrol', value: 89 }] },
      { label: 'Vuruş', value: 78, attributes: [{ label: 'Vuruş', value: 78 }] },
      { label: 'Refleks', value: 90, attributes: [{ label: 'Refleks', value: 90 }] },
      {
        label: 'Hız',
        value: 46,
        attributes: [
          { label: 'Hızlanma', value: 42 },
          { label: 'Sprint hızı', value: 52 },
        ],
      },
      { label: 'Pozisyon alma', value: 90, attributes: [{ label: 'Pozisyon alma', value: 90 }] },
    ]);
  });

  it('has no groups when the source reports no face stats', () => {
    expect(statGroups({ ...pele, faceStats: null, goalkeeperFaceStats: null })).toEqual([]);
  });
});

describe('positionName', () => {
  it('names every position in Turkish', () => {
    expect(POSITIONS.map(positionName)).toEqual([
      'Kaleci',
      'Sağ bek',
      'Stoper',
      'Sol bek',
      'Defansif orta saha',
      'Sağ orta saha',
      'Merkez orta saha',
      'Sol orta saha',
      'Ofansif orta saha',
      'Sağ kanat',
      'Santrafor',
      'Sol kanat',
    ]);
  });
});

describe('footLabel', () => {
  it('names both feet', () => {
    expect(footLabel('right')).toBe('Sağ');
    expect(footLabel('left')).toBe('Sol');
  });
});

describe('accelerateLabel', () => {
  it('names every AcceleRATE type in Turkish', () => {
    expect(ACCELERATE_TYPES.map(accelerateLabel)).toEqual([
      'Patlayıcı',
      'Çoğunlukla patlayıcı',
      'Kontrollü patlayıcı',
      'Kontrollü',
      'Kontrollü uzun',
      'Çoğunlukla uzun',
      'Uzun',
    ]);
  });
});

describe('accelerateByStyle', () => {
  it('groups the chemistry styles by the AcceleRATE type they give, in type order', () => {
    // Raw fixture: Pelé is Controlled with Architect and Sniper, Explosive with the rest.
    expect(accelerateByStyle(pele)).toEqual([
      {
        label: 'Patlayıcı',
        styles:
          'Anchor, Artist, Backbone, Basic, Catalyst, Deadeye, Engine, Finisher, Gladiator, ' +
          'Guardian, Hawk, Hunter, Maestro, Marksman, Powerhouse, Sentinel, Shadow',
      },
      { label: 'Kontrollü', styles: 'Architect, Sniper' },
    ]);
    expect(accelerateByStyle(courtois)).toEqual([
      { label: 'Uzun', styles: 'Cat, GK Basic, Glove, Shield, Wall' },
    ]);
  });

  it('lists the style names alphabetically', () => {
    expect(
      accelerateByStyle({ accelerateTypeByStyle: { Sniper: 'lengthy', Anchor: 'lengthy' } }),
    ).toEqual([{ label: 'Uzun', styles: 'Anchor, Sniper' }]);
  });

  it('is null when the source has no per-style types', () => {
    expect(accelerateByStyle({ accelerateTypeByStyle: null })).toBeNull();
    expect(accelerateByStyle({})).toBeNull();
  });
});

// PlayStyle and role names are looked up by hand in FUT.GG's lists
// (packages/domain/test/fixtures/futgg-playstyles.json and futgg-roles.json).

describe('playStylesLabel', () => {
  it('lists the PlayStyles+ first, marked with +, then the PlayStyles', () => {
    // Pelé: playstylesPlus [0], playstyles [2, 39, 5, 16, 20, 22].
    expect(playStylesLabel(pele)).toBe(
      'Finesse Shot+, Power Shot, Precision Header, Incisive Pass, Technical, Trickster, Quick Step',
    );
    // Kubo: playstylesPlus [], playstyles [0, 37, 38, 16, 19].
    expect(playStylesLabel(kubo)).toBe(
      'Finesse Shot, Gamechanger, Inventive, Technical, First Touch',
    );
  });

  it('shows an unknown PlayStyle by its id', () => {
    expect(playStylesLabel({ playStyles: [99], playStylesPlus: [] })).toBe('PlayStyle #99');
  });

  it('shows a dash for a card without PlayStyles', () => {
    expect(playStylesLabel({ playStyles: [], playStylesPlus: [] })).toBe('—');
  });

  it('says when the source does not report PlayStyles', () => {
    expect(playStylesLabel({ playStyles: null, playStylesPlus: null })).toBe('Bilinmiyor');
  });
});

describe('rolesLabel', () => {
  it('lists the Role++ then the Role+ with their positions', () => {
    // Pelé: rolesPlusPlus [132, 143], rolesPlus [31].
    expect(rolesLabel(pele)).toBe('CAM Shadow Striker++, ST False 9++, CAM Playmaker+');
    // Courtois: rolesPlusPlus [101].
    expect(rolesLabel(courtois)).toBe('GK Goalkeeper++');
  });

  it('lists only the roles of a given position, without the position', () => {
    expect(rolesLabel(pele, 'ST')).toBe('False 9++');
    expect(rolesLabel(pele, 'CAM')).toBe('Shadow Striker++, Playmaker+');
    // Kubo: rolesPlus [23, 25, 36]; 36 is a RW role.
    expect(rolesLabel(kubo, 'RM')).toBe('Winger+, Wide Playmaker+');
  });

  it('shows a dash when the card has no role at the position', () => {
    expect(rolesLabel(pele, 'CB')).toBe('—');
    expect(rolesLabel({ rolesPlus: [], rolesPlusPlus: [] })).toBe('—');
  });

  it('shows an unknown role by its id', () => {
    expect(rolesLabel({ rolesPlus: [999], rolesPlusPlus: [998] })).toBe('Rol #998++, Rol #999+');
  });

  it('says when the source does not report roles', () => {
    expect(rolesLabel({ rolesPlus: null, rolesPlusPlus: null })).toBe('Bilinmiyor');
    expect(rolesLabel({ rolesPlus: null, rolesPlusPlus: null }, 'ST')).toBe('Bilinmiyor');
  });
});
