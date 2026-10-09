import type { Position } from '@fc27/data-sync';

export interface Role {
  readonly name: string;
  /** The card position the role belongs to. */
  readonly position: Position;
  /** EA's id of the Role+ version, as stored in a card's `rolesPlus`. */
  readonly plusId: number;
  /** EA's id of the Role++ version, as stored in a card's `rolesPlusPlus`. */
  readonly plusPlusId: number;
}

/** Every FC 27 role (source: FUT.GG, `/api/fut/roles/`, 2026-10-09). */
export const ROLES: readonly Role[] = [];
