import type { Position } from '@fc27/data-sync';

/** A position slot of a formation, e.g. `RCB`, whose card position is `CB`. */
export interface FormationSlot {
  readonly code: string;
  readonly position: Position;
}

export interface Formation {
  /** EA's formation id, as used by FUT.GG. */
  readonly id: number;
  readonly name: string;
  /** The eleven starting slots, goalkeeper first. */
  readonly slots: readonly FormationSlot[];
}

/** Every FC 27 Ultimate Team formation (source: FUT.GG, 2026-10-09; ADR-0006). */
export const FORMATIONS: readonly Formation[] = [];
