import type { AccelerateType, CatalogCard } from '@fc27/data-sync';

import type { ChemistryStyle } from './rules/chemistry-styles.js';

/**
 * The card's AcceleRATE type with a chemistry style at a chemistry (true-rating design §2.3):
 * the source's per-style type at full chemistry, the card's own type otherwise.
 */
export function accelerateTypeWith(
  _card: Pick<CatalogCard, 'accelerateType' | 'accelerateTypeByStyle'>,
  _style: ChemistryStyle | null,
  _chemistry: number,
): AccelerateType | null {
  throw new Error('Not implemented');
}
