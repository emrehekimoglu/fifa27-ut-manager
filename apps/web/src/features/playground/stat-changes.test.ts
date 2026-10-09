import { describe, expect, it } from 'vitest';

import futggPage from '../../../../../packages/data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { parseFutggDefinitionsPage } from '@fc27/data-sync';
import type { CatalogCard } from '@fc27/data-sync';
import { CHEMISTRY_STYLES, applyChemistryStyle } from '@fc27/domain';
import type { ChemistryStyle } from '@fc27/domain';

import { statChanges } from './stat-changes';

const [pele, , courtois] = parseFutggDefinitionsPage(futggPage).cards as [
  CatalogCard,
  CatalogCard,
  CatalogCard,
];

const style = (name: string): ChemistryStyle => {
  const found = CHEMISTRY_STYLES.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`no style ${name}`);
  return found;
};

const printed = (card: CatalogCard) => ({
  attributes: card.attributes,
  faceStats: card.faceStats,
  goalkeeperFaceStats: card.goalkeeperFaceStats,
});

describe('statChanges', () => {
  it('shows no change for the printed stats', () => {
    const groups = statChanges(pele, printed(pele));
    expect(groups.map(({ label, value, change }) => [label, value, change])).toEqual([
      ['Hız', 93, 0],
      ['Şut', 94, 0],
      ['Pas', 91, 0],
      ['Dripling', 94, 0],
      ['Defans', 58, 0],
      ['Fizik', 74, 0],
    ]);
    expect(groups.flatMap((group) => group.attributes).every((row) => row.change === 0)).toBe(true);
  });

  it('shows what Hunter adds at full chemistry, including boosts capped at 99', () => {
    // Hunter at 3 chemistry: acceleration and sprint speed +6, positioning, finishing and
    // shot power +3, volleys +9 (94 → 103, capped at 99, so +5), penalties +6.
    const groups = statChanges(pele, applyChemistryStyle(pele, style('Hunter'), 3));
    expect(groups.map(({ label, value, change }) => [label, value, change])).toEqual([
      ['Hız', 99, 6],
      ['Şut', 97, 3],
      ['Pas', 91, 0],
      ['Dripling', 94, 0],
      ['Defans', 58, 0],
      ['Fizik', 74, 0],
    ]);
    expect(groups[0]?.attributes).toEqual([
      { label: 'Hızlanma', value: 99, change: 6 },
      { label: 'Sprint hızı', value: 99, change: 6 },
    ]);
    expect(groups[1]?.attributes).toEqual([
      { label: 'Pozisyon alma', value: 98, change: 3 },
      { label: 'Bitiricilik', value: 99, change: 3 },
      { label: 'Şut gücü', value: 96, change: 3 },
      { label: 'Uzaktan şut', value: 92, change: 0 },
      { label: 'Vole', value: 99, change: 5 },
      { label: 'Penaltı', value: 97, change: 6 },
    ]);
  });

  it('shows goalkeeper face stats for a goalkeeper', () => {
    const groups = statChanges(courtois, printed(courtois));
    expect(groups.map((group) => group.label)).toEqual([
      'Plonjon',
      'Elle kontrol',
      'Vuruş',
      'Refleks',
      'Hız',
      'Pozisyon alma',
    ]);
    expect(groups[0]).toEqual({
      label: 'Plonjon',
      value: 87,
      change: 0,
      attributes: [{ label: 'Plonjon', value: 87, change: 0 }],
    });
  });
});
