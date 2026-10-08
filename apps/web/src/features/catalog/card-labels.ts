import type { AccelerateType, CatalogCard, Foot, Position } from '@fc27/data-sync';

export interface StatRow {
  readonly label: string;
  readonly value: number;
}

/** A face stat with the attributes it is made of, as on the in-game card. */
export interface StatGroup extends StatRow {
  readonly attributes: readonly StatRow[];
}

/** Turkish name of a position, e.g. "Santrafor" for ST. */
export function positionName(_position: Position): string {
  throw new Error('Not implemented');
}

export function footLabel(_foot: Foot): string {
  throw new Error('Not implemented');
}

export function accelerateLabel(_type: AccelerateType): string {
  throw new Error('Not implemented');
}

/** Face stats with their attributes: six outfield groups, or one goalkeeper group. */
export function statGroups(_card: CatalogCard): readonly StatGroup[] {
  throw new Error('Not implemented');
}
