import type { FormationSlot } from '@fc27/domain';

/** Where a slot's card sits on the pitch, in percent of its width (x) and height (y). */
export interface PitchSpot {
  readonly x: number;
  readonly y: number;
}

/** The slot's spot on a pitch drawn with the goal at the bottom and attack at the top. */
export function pitchSpot(_slot: FormationSlot): PitchSpot {
  throw new Error('Not implemented');
}
