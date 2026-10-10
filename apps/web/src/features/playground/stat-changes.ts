import type { CatalogCard } from '@fc27/data-sync';
import type { CardStats, ChemistryStyle } from '@fc27/domain';

import type { Attributes } from '@fc27/data-sync';

import { attributeLabel, statGroups } from '../catalog/card-labels';

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
  const current = statGroups({ ...card, ...stats });
  // Both lists come from the same card kind, so they line up; slicing pairs them without
  // indexing into a possibly missing element.
  return statGroups(card).flatMap((printed, index) =>
    current.slice(index, index + 1).map((group) => ({
      label: group.label,
      value: group.value,
      change: group.value - printed.value,
      attributes: printed.attributes.flatMap((before, at) =>
        group.attributes.slice(at, at + 1).map((row) => ({
          label: row.label,
          value: row.value,
          change: row.value - before.value,
        })),
      ),
    })),
  );
}

export interface StyleBoost {
  readonly label: string;
  readonly boost: number;
}

/** What a chemistry style adds to each attribute at full chemistry, e.g. Hızlanma +6. */
export function styleBoosts(style: ChemistryStyle): readonly StyleBoost[] {
  return (Object.entries(style.boosts) as [keyof Attributes, number][]).map(([key, boost]) => ({
    label: attributeLabel(key),
    boost,
  }));
}
