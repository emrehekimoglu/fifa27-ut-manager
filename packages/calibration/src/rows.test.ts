import { describe, expect, it } from 'vitest';

import futggPage from '../../data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { parseFutggDefinitionsPage } from '@fc27/data-sync';
import type { CatalogCard } from '@fc27/data-sync';
import { CHEMISTRY_STYLES, trueRatingTerms } from '@fc27/domain';
import { calibrationRows, scoresMatchCard } from './rows.js';

const [pele] = parseFutggDefinitionsPage(futggPage).cards as [CatalogCard];

const style = (name: string) => {
  const found = CHEMISTRY_STYLES.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`no style ${name}`);
  return found;
};

describe('calibrationRows', () => {
  it('takes the best role score per position and style the card can use', () => {
    // Pelé plays CAM (roles 37–40) and ST (63–66). Sniper is style 2, Hunter 17.
    const rows = calibrationRows(pele, [
      { role: 37, chemistryStyle: 17, score: 90 },
      { role: 38, chemistryStyle: 17, score: 92 },
      { role: 63, chemistryStyle: 17, score: 88 },
      { role: 37, chemistryStyle: 2, score: 91 },
      // CB role: Pelé does not play CB.
      { role: 3, chemistryStyle: 17, score: 50 },
      // Wall (21) is a goalkeeper style.
      { role: 37, chemistryStyle: 21, score: 70 },
      // A role id outside the known blocks.
      { role: 99, chemistryStyle: 17, score: 99 },
    ]);
    expect(
      rows.map(({ position, group, style: name, reference }) => [position, group, name, reference]),
    ).toEqual([
      ['CAM', 'CAM', 'Sniper', 91],
      ['CAM', 'CAM', 'Hunter', 92],
      ['ST', 'ST', 'Hunter', 88],
    ]);
    expect(rows[0]).toMatchObject({ eaId: 237067, name: 'Pelé' });
    expect(rows[2]?.terms).toEqual(trueRatingTerms(pele, 'ST', style('Hunter'), 3));
  });

  it('has no rows without scores', () => {
    expect(calibrationRows(pele, [])).toEqual([]);
  });
});

describe('scoresMatchCard', () => {
  it('accepts scores that rate the card at its primary position', () => {
    // Pelé's primary position is CAM (roles 37–40).
    expect(
      scoresMatchCard(pele, [
        { role: 63, chemistryStyle: 1, score: 90 },
        { role: 37, chemistryStyle: 1, score: 91 },
      ]),
    ).toBe(true);
  });

  it('refuses scores of another version of the card, without its primary position', () => {
    expect(scoresMatchCard(pele, [{ role: 63, chemistryStyle: 1, score: 60 }])).toBe(false);
    expect(scoresMatchCard(pele, [])).toBe(false);
  });
});
