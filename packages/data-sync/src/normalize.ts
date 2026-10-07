import { z } from 'zod';

import { ACCELERATE_TYPES, SourceValidationError } from './catalog-card.js';
import type {
  AccelerateType,
  CardSource,
  ChemistryProfile,
  Foot,
  Position,
} from './catalog-card.js';

/** EA position IDs, shared by FUT.GG and EA's ratings API (see ADR-0003). */
const POSITION_BY_ID: ReadonlyMap<number, Position> = new Map([
  [0, 'GK'],
  [3, 'RB'],
  [5, 'CB'],
  [7, 'LB'],
  [10, 'CDM'],
  [12, 'RM'],
  [14, 'CM'],
  [16, 'LM'],
  [18, 'CAM'],
  [23, 'RW'],
  [25, 'ST'],
  [27, 'LW'],
]);

const FOOT_BY_ID: ReadonlyMap<number, Foot> = new Map([
  [1, 'right'],
  [2, 'left'],
]);

export function toPosition(source: CardSource, id: number): Position {
  const position = POSITION_BY_ID.get(id);
  if (!position) throw new SourceValidationError(source, `unknown position id ${id}`);
  return position;
}

export function toFoot(source: CardSource, id: number): Foot {
  const foot = FOOT_BY_ID.get(id);
  if (!foot) throw new SourceValidationError(source, `unknown foot value ${id}`);
  return foot;
}

export function toAccelerateType(source: CardSource, raw: string): AccelerateType {
  const normalized = raw.toLowerCase();
  const match = ACCELERATE_TYPES.find((type) => type === normalized);
  if (!match) throw new SourceValidationError(source, `unknown AcceleRATE type ${raw}`);
  return match;
}

export function displayName(
  commonName: string | null,
  firstName: string,
  lastName: string,
): string {
  return commonName !== null && commonName !== '' ? commonName : `${firstName} ${lastName}`;
}

export const NO_SPECIAL_CHEMISTRY: ChemistryProfile = {
  fullChemistryInPosition: false,
  extraClubChemistry: 0,
  extraLeagueChemistry: 0,
  extraNationChemistry: 0,
  countsForEveryLeague: false,
  countsForEveryNation: false,
};

/** Parses with a zod schema, turning schema violations into a SourceValidationError. */
export function parseWith<T>(source: CardSource, schema: z.ZodType<T>, json: unknown): T {
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new SourceValidationError(source, `invalid response: ${z.prettifyError(result.error)}`);
  }
  return result.data;
}
