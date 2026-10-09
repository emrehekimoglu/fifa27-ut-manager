import type { CatalogCard } from '@fc27/data-sync';
import type { CardStats } from '@fc27/domain';

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
export function statChanges(_card: CatalogCard, _stats: CardStats): readonly StatGroupChange[] {
  throw new Error('Not implemented');
}
