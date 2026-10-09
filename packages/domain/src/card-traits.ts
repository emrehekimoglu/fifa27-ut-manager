import type { CatalogCard, Position } from '@fc27/data-sync';

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
  _card: Pick<CatalogCard, 'playStyles' | 'playStylesPlus'>,
): readonly CardPlayStyle[] | null {
  throw new Error('Not implemented');
}

/**
 * The card's Role++ then Role+, optionally only those of `position`,
 * or null when the source does not report them.
 */
export function cardRoles(
  _card: Pick<CatalogCard, 'rolesPlus' | 'rolesPlusPlus'>,
  _position?: Position,
): readonly CardRole[] | null {
  throw new Error('Not implemented');
}
