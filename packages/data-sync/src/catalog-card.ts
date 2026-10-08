/**
 * Source-independent card model produced by every source adapter.
 *
 * Convention: `null` means "this source does not provide the value",
 * an empty array means "the card has none".
 */

export const POSITIONS = [
  'GK',
  'RB',
  'CB',
  'LB',
  'CDM',
  'RM',
  'CM',
  'LM',
  'CAM',
  'RW',
  'ST',
  'LW',
] as const;
export type Position = (typeof POSITIONS)[number];

export type Foot = 'left' | 'right';

export const ACCELERATE_TYPES = [
  'explosive',
  'mostly_explosive',
  'controlled_explosive',
  'controlled',
  'controlled_lengthy',
  'mostly_lengthy',
  'lengthy',
] as const;
export type AccelerateType = (typeof ACCELERATE_TYPES)[number];

export type CardSource = 'futgg' | 'ea';

export interface EntityRef {
  readonly eaId: number;
  readonly name: string;
}

export interface LeagueRef {
  /** EA's ratings API names leagues but does not identify them. */
  readonly eaId: number | null;
  readonly name: string;
}

export interface FaceStats {
  readonly pace: number;
  readonly shooting: number;
  readonly passing: number;
  readonly dribbling: number;
  readonly defending: number;
  readonly physicality: number;
}

export interface GoalkeeperFaceStats {
  readonly diving: number;
  readonly handling: number;
  readonly kicking: number;
  readonly reflexes: number;
  readonly speed: number;
  readonly positioning: number;
}

export interface Attributes {
  readonly acceleration: number;
  readonly sprintSpeed: number;
  readonly agility: number;
  readonly balance: number;
  readonly jumping: number;
  readonly stamina: number;
  readonly strength: number;
  readonly reactions: number;
  readonly aggression: number;
  readonly composure: number;
  readonly interceptions: number;
  readonly positioning: number;
  readonly vision: number;
  readonly ballControl: number;
  readonly crossing: number;
  readonly dribbling: number;
  readonly finishing: number;
  readonly freeKickAccuracy: number;
  readonly headingAccuracy: number;
  readonly longPassing: number;
  readonly shortPassing: number;
  readonly defensiveAwareness: number;
  readonly shotPower: number;
  readonly longShots: number;
  readonly standingTackle: number;
  readonly slidingTackle: number;
  readonly volleys: number;
  readonly curve: number;
  readonly penalties: number;
  readonly gkDiving: number;
  readonly gkHandling: number;
  readonly gkKicking: number;
  readonly gkReflexes: number;
  readonly gkPositioning: number;
}

/** Special chemistry behaviour as reported by the source; interpreted by the domain engine. */
export interface ChemistryProfile {
  readonly fullChemistryInPosition: boolean;
  readonly extraClubChemistry: number;
  readonly extraLeagueChemistry: number;
  readonly extraNationChemistry: number;
  readonly countsForEveryLeague: boolean;
  readonly countsForEveryNation: boolean;
}

export interface CatalogCard {
  readonly source: CardSource;
  /** Unique per card version (promos and holographic variants have their own). */
  readonly eaId: number;
  /** Shared by all versions of the same player. */
  readonly basePlayerEaId: number;
  readonly name: string;
  readonly overall: number;
  readonly position: Position;
  readonly alternatePositions: readonly Position[];
  readonly rarity: EntityRef | null;
  /** Null for cards without a club, such as heroes, which belong only to a league. */
  readonly club: EntityRef | null;
  readonly league: LeagueRef;
  readonly nation: EntityRef;
  /** Outfield face stats; null when the source only reports goalkeeper face stats. */
  readonly faceStats: FaceStats | null;
  /** Goalkeeper face stats; null for outfield players. */
  readonly goalkeeperFaceStats: GoalkeeperFaceStats | null;
  readonly attributes: Attributes;
  readonly skillMoves: number;
  readonly weakFoot: number;
  readonly foot: Foot;
  readonly heightCm: number | null;
  readonly weightKg: number | null;
  readonly accelerateType: AccelerateType | null;
  readonly playStyles: readonly number[] | null;
  readonly playStylesPlus: readonly number[] | null;
  readonly rolesPlus: readonly number[] | null;
  readonly rolesPlusPlus: readonly number[] | null;
  readonly chemistry: ChemistryProfile;
  readonly isUntradeable: boolean;
  readonly imageUrl: string;
}

/** Thrown when a source response does not match the expected shape. */
export class SourceValidationError extends Error {
  constructor(
    readonly source: CardSource,
    message: string,
  ) {
    super(`[${source}] ${message}`);
    this.name = 'SourceValidationError';
  }
}
