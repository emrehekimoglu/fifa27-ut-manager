import type { Position } from '@fc27/data-sync';
import type { FormationSlot } from '@fc27/domain';

/** Where a slot's card sits on the pitch, in percent of its width (x) and height (y). */
export interface PitchSpot {
  readonly x: number;
  readonly y: number;
}

/** The row of each card position, from the forwards at the top to the goalkeeper. */
const ROWS: Readonly<Record<Position, number>> = {
  ST: 13,
  LW: 13,
  RW: 13,
  CAM: 28,
  CM: 44,
  LM: 44,
  RM: 44,
  CDM: 59,
  CB: 74,
  LB: 74,
  RB: 74,
  GK: 89,
};

const WIDE_LEFT: readonly Position[] = ['LB', 'LM', 'LW'];
const WIDE_RIGHT: readonly Position[] = ['RB', 'RM', 'RW'];

/** The column: full backs, wide midfielders and wingers on the flanks, L…/R… codes beside the centre. */
function column(slot: FormationSlot): number {
  if (WIDE_LEFT.includes(slot.position)) return 12;
  if (WIDE_RIGHT.includes(slot.position)) return 88;
  if (slot.code.startsWith('L')) return 32;
  if (slot.code.startsWith('R')) return 68;
  return 50;
}

/** The slot's spot on a pitch drawn with the goal at the bottom and attack at the top. */
export function pitchSpot(slot: FormationSlot): PitchSpot {
  return { x: column(slot), y: ROWS[slot.position] };
}
