import { describe, expect, it } from 'vitest';

import futggPage from '../../data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { parseFutggDefinitionsPage } from '@fc27/data-sync';
import type { CatalogCard } from '@fc27/data-sync';
import { accelerateTypeWith } from './accelerate.js';
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

// The raw fixture lists Pelé (base type EXPLOSIVE) as Controlled with Architect and Sniper
// and Explosive with the other 17 outfield styles; Courtois is Lengthy with every style.

describe('accelerateTypeWith', () => {
  it('takes the per-style type at full chemistry', () => {
    expect(accelerateTypeWith(pele, style('Sniper'), 3)).toBe('controlled');
    expect(accelerateTypeWith(pele, style('Architect'), 3)).toBe('controlled');
    expect(accelerateTypeWith(pele, style('Hunter'), 3)).toBe('explosive');
    expect(accelerateTypeWith(courtois, style('Wall'), 3)).toBe('lengthy');
  });

  it('keeps the card’s own type below full chemistry', () => {
    expect(accelerateTypeWith(pele, style('Sniper'), 2)).toBe('explosive');
    expect(accelerateTypeWith(pele, style('Sniper'), 1)).toBe('explosive');
    expect(accelerateTypeWith(pele, style('Sniper'), 0)).toBe('explosive');
  });

  it('keeps the card’s own type without a chemistry style', () => {
    expect(accelerateTypeWith(pele, null, 3)).toBe('explosive');
  });

  it('keeps the card’s own type when the source has no per-style type', () => {
    const sniper = style('Sniper');
    expect(accelerateTypeWith({ ...pele, accelerateTypeByStyle: null }, sniper, 3)).toBe(
      'explosive',
    );
    expect(
      accelerateTypeWith({ ...pele, accelerateTypeByStyle: { Hunter: 'lengthy' } }, sniper, 3),
    ).toBe('explosive');
    // Cards stored before the per-style table was added have no such field.
    expect(accelerateTypeWith({ accelerateType: 'explosive' }, sniper, 3)).toBe('explosive');
  });

  it('is unknown when the source knows no type at all', () => {
    const unknown = { accelerateType: null, accelerateTypeByStyle: null };
    expect(accelerateTypeWith(unknown, style('Sniper'), 3)).toBeNull();
  });
});
