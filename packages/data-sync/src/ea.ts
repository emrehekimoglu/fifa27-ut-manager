import { z } from 'zod';

import type { CatalogCard } from './catalog-card.js';
import { getJson } from './http.js';
import type { FetchFn } from './http.js';
import { NO_SPECIAL_CHEMISTRY, displayName, parseWith, toFoot, toPosition } from './normalize.js';

export const EA_RATINGS_URL = 'https://drop-api.ea.com/rating/ea-sports-fc';
/** Without this header the API serves the previous game's ratings. */
export const EA_RATINGS_REFERRER = 'https://www.ea.com/games/ea-sports-fc/ratings';

export interface EaRatingsPage {
  readonly cards: readonly CatalogCard[];
  readonly totalItems: number;
}

export interface EaRatingsQuery {
  readonly offset: number;
  readonly limit: number;
  /** The CDN caches by URL only, so every request carries a unique value. */
  readonly cacheBust: string;
}

const int = z.number().int();
const stat = z.object({ value: int });
/** EA sends height and weight as strings, empty when unknown. */
const measurement = z
  .union([z.literal(''), z.string().regex(/^\d+$/)])
  .transform((value) => (value === '' ? null : Number(value)));
const positionRef = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

const itemSchema = z.object({
  id: int,
  overallRating: int,
  firstName: z.string(),
  lastName: z.string(),
  commonName: z.string().nullable(),
  height: measurement,
  weight: measurement,
  skillMoves: int,
  weakFootAbility: int,
  preferredFoot: int,
  leagueName: z.string(),
  position: positionRef,
  alternatePositions: z.array(positionRef).nullable(),
  nationality: z.object({ id: int, label: z.string() }),
  team: z.object({ id: int, label: z.string() }),
  stats: z.object({
    pac: stat,
    sho: stat,
    pas: stat,
    dri: stat,
    def: stat,
    phy: stat,
    acceleration: stat,
    sprintSpeed: stat,
    agility: stat,
    balance: stat,
    jumping: stat,
    stamina: stat,
    strength: stat,
    reactions: stat,
    aggression: stat,
    composure: stat,
    interceptions: stat,
    positioning: stat,
    vision: stat,
    ballControl: stat,
    crossing: stat,
    dribbling: stat,
    finishing: stat,
    freeKickAccuracy: stat,
    headingAccuracy: stat,
    longPassing: stat,
    shortPassing: stat,
    defensiveAwareness: stat,
    shotPower: stat,
    longShots: stat,
    standingTackle: stat,
    slidingTackle: stat,
    volleys: stat,
    curve: stat,
    penalties: stat,
    gkDiving: stat,
    gkHandling: stat,
    gkKicking: stat,
    gkReflexes: stat,
    gkPositioning: stat,
  }),
});

const pageSchema = z.object({ items: z.array(itemSchema), totalItems: int });

type EaItem = z.infer<typeof itemSchema>;

function toCard(item: EaItem): CatalogCard {
  const position = toPosition('ea', item.position.id);
  const s = item.stats;
  // For goalkeepers EA reports the goalkeeper face stats in the six face-stat slots.
  const isGoalkeeper = position === 'GK';
  return {
    source: 'ea',
    eaId: item.id,
    basePlayerEaId: item.id,
    name: displayName(item.commonName, item.firstName, item.lastName),
    overall: item.overallRating,
    position,
    alternatePositions: (item.alternatePositions ?? []).map((ref) => toPosition('ea', ref.id)),
    rarity: null,
    club: { eaId: item.team.id, name: item.team.label },
    league: { eaId: null, name: item.leagueName },
    nation: { eaId: item.nationality.id, name: item.nationality.label },
    faceStats: isGoalkeeper
      ? null
      : {
          pace: s.pac.value,
          shooting: s.sho.value,
          passing: s.pas.value,
          dribbling: s.dri.value,
          defending: s.def.value,
          physicality: s.phy.value,
        },
    goalkeeperFaceStats: isGoalkeeper
      ? {
          diving: s.pac.value,
          handling: s.sho.value,
          kicking: s.pas.value,
          reflexes: s.dri.value,
          speed: s.def.value,
          positioning: s.phy.value,
        }
      : null,
    attributes: {
      acceleration: s.acceleration.value,
      sprintSpeed: s.sprintSpeed.value,
      agility: s.agility.value,
      balance: s.balance.value,
      jumping: s.jumping.value,
      stamina: s.stamina.value,
      strength: s.strength.value,
      reactions: s.reactions.value,
      aggression: s.aggression.value,
      composure: s.composure.value,
      interceptions: s.interceptions.value,
      positioning: s.positioning.value,
      vision: s.vision.value,
      ballControl: s.ballControl.value,
      crossing: s.crossing.value,
      dribbling: s.dribbling.value,
      finishing: s.finishing.value,
      freeKickAccuracy: s.freeKickAccuracy.value,
      headingAccuracy: s.headingAccuracy.value,
      longPassing: s.longPassing.value,
      shortPassing: s.shortPassing.value,
      defensiveAwareness: s.defensiveAwareness.value,
      shotPower: s.shotPower.value,
      longShots: s.longShots.value,
      standingTackle: s.standingTackle.value,
      slidingTackle: s.slidingTackle.value,
      volleys: s.volleys.value,
      curve: s.curve.value,
      penalties: s.penalties.value,
      gkDiving: s.gkDiving.value,
      gkHandling: s.gkHandling.value,
      gkKicking: s.gkKicking.value,
      gkReflexes: s.gkReflexes.value,
      gkPositioning: s.gkPositioning.value,
    },
    skillMoves: item.skillMoves,
    weakFoot: item.weakFootAbility,
    foot: toFoot('ea', item.preferredFoot),
    heightCm: item.height,
    weightKg: item.weight,
    accelerateType: null,
    accelerateTypeByStyle: null,
    playStyles: null,
    playStylesPlus: null,
    rolesPlus: null,
    rolesPlusPlus: null,
    chemistry: NO_SPECIAL_CHEMISTRY,
    isUntradeable: false,
    // EA's shield and avatar URLs still point to FC 25 images, which show outdated cards.
    imageUrl: null,
  };
}

export function parseEaRatingsPage(json: unknown): EaRatingsPage {
  const page = parseWith('ea', pageSchema, json);
  return { cards: page.items.map(toCard), totalItems: page.totalItems };
}

export async function fetchEaRatingsPage(
  query: EaRatingsQuery,
  fetchFn: FetchFn,
): Promise<EaRatingsPage> {
  const params = new URLSearchParams({
    locale: 'en',
    limit: String(query.limit),
    offset: String(query.offset),
    cb: query.cacheBust,
  });
  const json = await getJson('ea', `${EA_RATINGS_URL}?${params.toString()}`, fetchFn, {
    'drop-referrer': EA_RATINGS_REFERRER,
  });
  return parseEaRatingsPage(json);
}
