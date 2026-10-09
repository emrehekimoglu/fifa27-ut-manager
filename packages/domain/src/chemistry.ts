import type { CatalogCard, Position } from '@fc27/data-sync';

import type { Formation } from './rules/formations.js';

/** The manager counts once toward his nation and his league. */
export interface Manager {
  readonly nationEaId: number;
  readonly leagueEaId: number;
}

export interface SquadChemistry {
  /** Each starter's chemistry (0–3), in formation slot order; 0 for an empty slot. */
  readonly players: readonly number[];
  /** The squad's chemistry (0–33). */
  readonly total: number;
}

export type ChemistryKind = 'club' | 'league' | 'nation';

/** Whether the card's primary or an alternate position is the slot's position. */
export function canPlay(_card: CatalogCard, _position: Position): boolean {
  throw new Error('Not implemented');
}

/** Points (0–3) earned by `count` players sharing a club, league or nation. */
export function chemistryPoints(_kind: ChemistryKind, _count: number): number {
  throw new Error('Not implemented');
}

/** The chemistry of a starting XI in a formation (PRD §7.1). */
export function squadChemistry(
  _formation: Formation,
  _starters: readonly (CatalogCard | null)[],
  _manager: Manager | null = null,
): SquadChemistry {
  throw new Error('Not implemented');
}
