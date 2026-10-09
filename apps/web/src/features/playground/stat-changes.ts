import type { CatalogCard } from '@fc27/data-sync';
import type { CardStats, ChemistryStyle } from '@fc27/domain';

import { statGroups } from '../catalog/card-labels';

export interface StatChange {
  readonly label: string;
  readonly value: number;
  /** The difference to the printed card, e.g. +6 from a chemistry style. */
  readonly change: number;
}

export interface StatGroupChange extends StatChange {
  readonly attributes: readonly StatChange[];
}

/** The card's face stats and attributes with `stats` applied, each with its change. */
export function statChanges(card: CatalogCard, stats: CardStats): readonly StatGroupChange[] {
  const before = statGroups(card);
  return statGroups({ ...card, ...stats }).map((group, index) => {
    const printed = before[index];
    return {
      label: group.label,
      value: group.value,
      change: group.value - (printed?.value ?? group.value),
      attributes: group.attributes.map((row, at) => ({
        label: row.label,
        value: row.value,
        change: row.value - (printed?.attributes[at]?.value ?? row.value),
      })),
    };
  });
}

export interface StyleBoost {
  readonly label: string;
  readonly boost: number;
}

/** What a chemistry style adds to each attribute at full chemistry, e.g. Hızlanma +6. */
export function styleBoosts(_style: ChemistryStyle): readonly StyleBoost[] {
  throw new Error('Not implemented');
}
