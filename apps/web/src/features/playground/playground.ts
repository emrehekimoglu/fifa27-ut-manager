import type { CatalogCard, Position } from '@fc27/data-sync';
import type { CardStats, Formation } from '@fc27/domain';

export interface PlaygroundSlot {
  readonly card: CatalogCard | null;
  /** The chosen chemistry style, or null for none. */
  readonly styleId: number | null;
}

/** A starting XI being tried out: a formation and one entry per slot. */
export interface Playground {
  readonly formationId: number;
  readonly slots: readonly PlaygroundSlot[];
}

/** 4-3-3, the formation a new playground starts with. */
export const DEFAULT_FORMATION_ID = 8;

export interface EvaluatedSlot {
  readonly code: string;
  readonly position: Position;
  readonly card: CatalogCard | null;
  readonly styleId: number | null;
  /** Whether the card can play the slot's position; false for an empty slot. */
  readonly inPosition: boolean;
  readonly chemistry: number;
  /** The card's stats with its chemistry style applied; null for an empty slot. */
  readonly stats: CardStats | null;
}

export interface Evaluation {
  readonly formation: Formation;
  readonly slots: readonly EvaluatedSlot[];
  /** Squad chemistry, 0–33. */
  readonly chemistry: number;
  readonly rating: number;
}

export function newPlayground(_formationId: number = DEFAULT_FORMATION_ID): Playground {
  throw new Error('Not implemented');
}

/** Puts a card into a slot; its chemistry style starts empty. */
export function placeCard(_playground: Playground, _index: number, _card: CatalogCard): Playground {
  throw new Error('Not implemented');
}

export function removeCard(_playground: Playground, _index: number): Playground {
  throw new Error('Not implemented');
}

export function chooseStyle(
  _playground: Playground,
  _index: number,
  _styleId: number | null,
): Playground {
  throw new Error('Not implemented');
}

/** Switches the formation; every card and style stays in its slot number. */
export function changeFormation(_playground: Playground, _formationId: number): Playground {
  throw new Error('Not implemented');
}

/** Chemistry, squad rating and boosted stats of the playground's XI. */
export function evaluate(_playground: Playground): Evaluation {
  throw new Error('Not implemented');
}

/** A formation's name in Turkish, e.g. "4-3-3 Hücum" for 4-3-3 Attack. */
export function formationLabel(_name: string): string {
  throw new Error('Not implemented');
}
