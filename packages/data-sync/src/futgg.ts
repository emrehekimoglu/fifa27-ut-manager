import { z } from 'zod';

import { SourceValidationError } from './catalog-card.js';
import type { AccelerateType, CatalogCard } from './catalog-card.js';
import { getJson } from './http.js';
import type { FetchFn } from './http.js';
import { displayName, parseWith, toAccelerateType, toFoot, toPosition } from './normalize.js';

export const FUTGG_DEFINITIONS_URL = 'https://www.fut.gg/api/fut/players/v2/27/definitions/';
export const FUTGG_IMAGE_BASE_URL =
  'https://game-assets.fut.gg/cdn-cgi/image/quality=85,format=auto,width=300/';
/** FUT.GG never returns more than this many results for a single query. */
export const FUTGG_QUERY_RESULT_CAP = 10_000;

export interface FutggDefinitionsPage {
  readonly cards: readonly CatalogCard[];
  readonly currentPage: number;
  readonly nextPage: number | null;
  readonly total: number;
}

const int = z.number().int();
const ids = z.array(int);
const entityRef = z.object({ eaId: int, name: z.string() });

const itemSchema = z.object({
  eaId: int,
  basePlayerEaId: int,
  commonName: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  overall: int,
  position: int,
  alternativePositionIds: ids,
  rarity: entityRef,
  // Heroes belong to a league but to no club.
  club: entityRef.nullable(),
  league: entityRef,
  nation: entityRef,
  facePace: int,
  faceShooting: int,
  facePassing: int,
  faceDribbling: int,
  faceDefending: int,
  facePhysicality: int,
  gkFaceDiving: int,
  gkFaceHandling: int,
  gkFaceKicking: int,
  gkFaceReflexes: int,
  gkFaceSpeed: int,
  gkFacePositioning: int,
  attributeAcceleration: int,
  attributeSprintSpeed: int,
  attributeAgility: int,
  attributeBalance: int,
  attributeJumping: int,
  attributeStamina: int,
  attributeStrength: int,
  attributeReactions: int,
  attributeAggression: int,
  attributeComposure: int,
  attributeInterceptions: int,
  attributePositioning: int,
  attributeVision: int,
  attributeBallControl: int,
  attributeCrossing: int,
  attributeDribbling: int,
  attributeFinishing: int,
  attributeFkAccuracy: int,
  attributeHeadingAccuracy: int,
  attributeLongPassing: int,
  attributeShortPassing: int,
  attributeDefensiveAwareness: int,
  attributeShotPower: int,
  attributeLongShots: int,
  attributeStandingTackle: int,
  attributeSlidingTackle: int,
  attributeVolleys: int,
  attributeCurve: int,
  attributePenalties: int,
  attributeGkDiving: int,
  attributeGkHandling: int,
  attributeGkKicking: int,
  attributeGkReflexes: int,
  attributeGkPositioning: int,
  skillMoves: int,
  weakFoot: int,
  foot: int,
  height: int.nullable(),
  weight: int.nullable(),
  accelerateType: z.string().nullable(),
  accelerateTypes: z.record(z.string(), z.array(z.string())).nullable(),
  playstyles: ids,
  playstylesPlus: ids,
  rolesPlus: ids,
  rolesPlusPlus: ids,
  isFullChemistry: z.boolean(),
  extraClubChemistry: int,
  extraLeagueChemistry: int,
  extraNationChemistry: int,
  extraSquadLeagueChemistry: z.boolean(),
  extraSquadNationChemistry: z.boolean(),
  isUntradeable: z.boolean(),
  futggCardImagePath: z.string(),
});

const pageSchema = z.object({
  data: z.array(itemSchema),
  next: int.nullable(),
  currentPage: int,
  total: int,
});

type FutggItem = z.infer<typeof itemSchema>;

/** FUT.GG's style names per AcceleRATE type (keys like `mostlyExplosive`) as a type per style. */
function accelerateTypeByStyle(
  stylesByType: Readonly<Record<string, readonly string[]>>,
): Record<string, AccelerateType> {
  const byStyle: Record<string, AccelerateType> = {};
  for (const [key, styles] of Object.entries(stylesByType)) {
    const type = toAccelerateType(
      'futgg',
      key.replace(/[A-Z]/g, (letter) => `_${letter}`),
    );
    for (const style of styles) {
      if (style in byStyle) {
        throw new SourceValidationError(
          'futgg',
          `chemistry style ${style} has two AcceleRATE types`,
        );
      }
      byStyle[style] = type;
    }
  }
  return byStyle;
}

function toCard(item: FutggItem): CatalogCard {
  const position = toPosition('futgg', item.position);
  return {
    source: 'futgg',
    eaId: item.eaId,
    basePlayerEaId: item.basePlayerEaId,
    name: displayName(item.commonName, item.firstName, item.lastName),
    overall: item.overall,
    position,
    alternatePositions: item.alternativePositionIds.map((id) => toPosition('futgg', id)),
    rarity: item.rarity,
    club: item.club,
    league: item.league,
    nation: item.nation,
    faceStats: {
      pace: item.facePace,
      shooting: item.faceShooting,
      passing: item.facePassing,
      dribbling: item.faceDribbling,
      defending: item.faceDefending,
      physicality: item.facePhysicality,
    },
    goalkeeperFaceStats:
      position === 'GK'
        ? {
            diving: item.gkFaceDiving,
            handling: item.gkFaceHandling,
            kicking: item.gkFaceKicking,
            reflexes: item.gkFaceReflexes,
            speed: item.gkFaceSpeed,
            positioning: item.gkFacePositioning,
          }
        : null,
    attributes: {
      acceleration: item.attributeAcceleration,
      sprintSpeed: item.attributeSprintSpeed,
      agility: item.attributeAgility,
      balance: item.attributeBalance,
      jumping: item.attributeJumping,
      stamina: item.attributeStamina,
      strength: item.attributeStrength,
      reactions: item.attributeReactions,
      aggression: item.attributeAggression,
      composure: item.attributeComposure,
      interceptions: item.attributeInterceptions,
      positioning: item.attributePositioning,
      vision: item.attributeVision,
      ballControl: item.attributeBallControl,
      crossing: item.attributeCrossing,
      dribbling: item.attributeDribbling,
      finishing: item.attributeFinishing,
      freeKickAccuracy: item.attributeFkAccuracy,
      headingAccuracy: item.attributeHeadingAccuracy,
      longPassing: item.attributeLongPassing,
      shortPassing: item.attributeShortPassing,
      defensiveAwareness: item.attributeDefensiveAwareness,
      shotPower: item.attributeShotPower,
      longShots: item.attributeLongShots,
      standingTackle: item.attributeStandingTackle,
      slidingTackle: item.attributeSlidingTackle,
      volleys: item.attributeVolleys,
      curve: item.attributeCurve,
      penalties: item.attributePenalties,
      gkDiving: item.attributeGkDiving,
      gkHandling: item.attributeGkHandling,
      gkKicking: item.attributeGkKicking,
      gkReflexes: item.attributeGkReflexes,
      gkPositioning: item.attributeGkPositioning,
    },
    skillMoves: item.skillMoves,
    weakFoot: item.weakFoot,
    foot: toFoot('futgg', item.foot),
    heightCm: item.height,
    weightKg: item.weight,
    accelerateType:
      item.accelerateType === null ? null : toAccelerateType('futgg', item.accelerateType),
    accelerateTypeByStyle:
      item.accelerateTypes === null ? null : accelerateTypeByStyle(item.accelerateTypes),
    playStyles: item.playstyles,
    playStylesPlus: item.playstylesPlus,
    rolesPlus: item.rolesPlus,
    rolesPlusPlus: item.rolesPlusPlus,
    chemistry: {
      fullChemistryInPosition: item.isFullChemistry,
      extraClubChemistry: item.extraClubChemistry,
      extraLeagueChemistry: item.extraLeagueChemistry,
      extraNationChemistry: item.extraNationChemistry,
      countsForEveryLeague: item.extraSquadLeagueChemistry,
      countsForEveryNation: item.extraSquadNationChemistry,
    },
    isUntradeable: item.isUntradeable,
    imageUrl: `${FUTGG_IMAGE_BASE_URL}${item.futggCardImagePath}`,
  };
}

export function parseFutggDefinitionsPage(json: unknown): FutggDefinitionsPage {
  const page = parseWith('futgg', pageSchema, json);
  return {
    cards: page.data.map(toCard),
    currentPage: page.currentPage,
    nextPage: page.next,
    total: page.total,
  };
}

/** Inclusive overall-rating range used to split the catalog below the query cap. */
export interface OverallRange {
  readonly min: number;
  readonly max: number;
}

export async function fetchFutggDefinitionsPage(
  page: number,
  fetchFn: FetchFn,
  range?: OverallRange,
): Promise<FutggDefinitionsPage> {
  // No sort parameter: FUT.GG's default order pages stably, sorting by overall does not (ADR-0005).
  const filter = range ? `&overall__gte=${range.min}&overall__lte=${range.max}` : '';
  const json = await getJson('futgg', `${FUTGG_DEFINITIONS_URL}?page=${page}${filter}`, fetchFn);
  return parseFutggDefinitionsPage(json);
}
