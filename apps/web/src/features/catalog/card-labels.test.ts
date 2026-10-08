import { describe, expect, it } from 'vitest';

import futggPage from '../../../../../packages/data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { ACCELERATE_TYPES, POSITIONS, parseFutggDefinitionsPage } from '@fc27/data-sync';
import type { CatalogCard } from '@fc27/data-sync';
import { accelerateLabel, footLabel, positionName, statGroups } from './card-labels';

const [pele, , courtois] = parseFutggDefinitionsPage(futggPage).cards as [
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
