import { FORMATIONS } from '@fc27/domain';
import type { Formation } from '@fc27/domain';
import { describe, expect, it } from 'vitest';

import { pitchSpot } from './pitch';

/*
 * The layout (attack at the top), worked out from the slot codes:
 * rows by card position — ST, LW, RW 13; CAM 28; CM, LM, RM 44; CDM 59; CB, LB, RB 74; GK 89;
 * columns by side — wide left (LB, LM, LW) 12, left of centre (L…) 32, centre 50,
 * right of centre (R…) 68, wide right (RB, RM, RW) 88.
 */

const formation = (name: string): Formation => {
  const found = FORMATIONS.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`no formation ${name}`);
  return found;
};

const spots = (name: string) =>
  formation(name).slots.map((slot) => ({ code: slot.code, ...pitchSpot(slot) }));

describe('pitchSpot', () => {
  it('lays out 4-3-3 with the back four, a midfield three and a front three', () => {
    expect(spots('4-3-3')).toEqual([
      { code: 'GK', x: 50, y: 89 },
      { code: 'RB', x: 88, y: 74 },
      { code: 'RCB', x: 68, y: 74 },
      { code: 'LCB', x: 32, y: 74 },
      { code: 'LB', x: 12, y: 74 },
      { code: 'RCM', x: 68, y: 44 },
      { code: 'CM', x: 50, y: 44 },
      { code: 'LCM', x: 32, y: 44 },
      { code: 'RW', x: 88, y: 13 },
      { code: 'ST', x: 50, y: 13 },
      { code: 'LW', x: 12, y: 13 },
    ]);
  });

  it('puts holding and attacking midfielders on their own rows in 4-2-3-1', () => {
    expect(spots('4-2-3-1').slice(5)).toEqual([
      { code: 'RDM', x: 68, y: 59 },
      { code: 'LDM', x: 32, y: 59 },
      { code: 'RAM', x: 68, y: 28 },
      { code: 'CAM', x: 50, y: 28 },
      { code: 'LAM', x: 32, y: 28 },
      { code: 'ST', x: 50, y: 13 },
    ]);
  });

  it('spreads a back five across the full width in 5-2-3', () => {
    expect(spots('5-2-3').slice(1, 6)).toEqual([
      { code: 'RB', x: 88, y: 74 },
      { code: 'RCB', x: 68, y: 74 },
      { code: 'CB', x: 50, y: 74 },
      { code: 'LCB', x: 32, y: 74 },
      { code: 'LB', x: 12, y: 74 },
    ]);
  });

  it('places wide midfielders and a strike pair in 4-4-2', () => {
    expect(spots('4-4-2').slice(5)).toEqual([
      { code: 'RM', x: 88, y: 44 },
      { code: 'RCM', x: 68, y: 44 },
      { code: 'LCM', x: 32, y: 44 },
      { code: 'LM', x: 12, y: 44 },
      { code: 'RS', x: 68, y: 13 },
      { code: 'LS', x: 32, y: 13 },
    ]);
  });

  it.each(FORMATIONS.map((candidate) => [candidate.name, candidate] as const))(
    'keeps every card of %s apart from the others on its row',
    (_name, candidate) => {
      const placed = candidate.slots.map(pitchSpot);
      for (const [index, spot] of placed.entries()) {
        for (const other of placed.slice(index + 1)) {
          if (other.y === spot.y) expect(Math.abs(other.x - spot.x)).toBeGreaterThanOrEqual(18);
        }
      }
    },
  );
});
