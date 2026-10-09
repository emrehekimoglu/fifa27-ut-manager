import type { CatalogCard, Position } from '@fc27/data-sync';

import { PLAYSTYLES } from './rules/playstyles.js';
import { ROLES } from './rules/roles.js';

/** A PlayStyle of a card. `name` is null for an id the rules data does not know. */
export interface CardPlayStyle {
  readonly id: number;
  readonly name: string | null;
  readonly plus: boolean;
}

/** A Role+ or Role++ of a card. `position` and `name` are null for an unknown id. */
export interface CardRole {
  readonly id: number;
  readonly position: Position | null;
  readonly name: string | null;
  readonly plusPlus: boolean;
}

/** The card's PlayStyles+ then PlayStyles, or null when the source does not report them. */
export function cardPlayStyles(
  card: Pick<CatalogCard, 'playStyles' | 'playStylesPlus'>,
): readonly CardPlayStyle[] | null {
  if (card.playStyles === null && card.playStylesPlus === null) return null;
  const named = (ids: readonly number[] | null, plus: boolean) =>
    (ids ?? []).map((id) => ({
      id,
      name: PLAYSTYLES.find((playStyle) => playStyle.id === id)?.name ?? null,
      plus,
    }));
  return [...named(card.playStylesPlus, true), ...named(card.playStyles, false)];
}

/**
 * The card's Role++ then Role+, optionally only those of `position`,
 * or null when the source does not report them.
 */
export function cardRoles(
  card: Pick<CatalogCard, 'rolesPlus' | 'rolesPlusPlus'>,
  position?: Position,
): readonly CardRole[] | null {
  if (card.rolesPlus === null && card.rolesPlusPlus === null) return null;
  const named = (ids: readonly number[] | null, plusPlus: boolean): CardRole[] =>
    (ids ?? []).map((id) => {
      const role = ROLES.find((candidate) =>
        plusPlus ? candidate.plusPlusId === id : candidate.plusId === id,
      );
      return { id, position: role?.position ?? null, name: role?.name ?? null, plusPlus };
    });
  const roles = [...named(card.rolesPlusPlus, true), ...named(card.rolesPlus, false)];
  return position === undefined ? roles : roles.filter((role) => role.position === position);
}
