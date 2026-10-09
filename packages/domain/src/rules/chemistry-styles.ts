import type { Attributes } from '@fc27/data-sync';

export interface ChemistryStyle {
  /** EA's chemistry style id. */
  readonly id: number;
  readonly name: string;
  /** Goalkeeper styles apply only to goalkeepers, the others only to outfield players. */
  readonly goalkeeper: boolean;
  /** Attribute boosts at 3 chemistry. */
  readonly boosts: Partial<Readonly<Record<keyof Attributes, number>>>;
}

/** Every FC 27 chemistry style (source: FUT.GG, 2026-10-09; ADR-0006). */
export const CHEMISTRY_STYLES: readonly ChemistryStyle[] = [];
