import type { CatalogCard, Position } from '@fc27/data-sync';

import { CHEMISTRY_THRESHOLDS, MAX_PLAYER_CHEMISTRY } from './rules/chemistry.js';
import type { Formation } from './rules/formations.js';

/** The manager counts once toward his nation and his league. */
export interface Manager {
  readonly nationEaId: number;
  readonly leagueEaId: number;
}

export interface SquadChemistry {
  /** Each starter's chemistry (0–3), in formation slot order; 0 for an empty slot. */
  readonly players: readonly number[];
  /** The squad's chemistry (0–33). */
  readonly total: number;
}

export type ChemistryKind = 'club' | 'league' | 'nation';

/** Whether the card's primary or an alternate position is the slot's position. */
export function canPlay(card: CatalogCard, position: Position): boolean {
  return card.position === position || card.alternatePositions.includes(position);
}

/** Points (0–3) earned by `count` players sharing a club, league or nation. */
export function chemistryPoints(kind: ChemistryKind, count: number): number {
  return CHEMISTRY_THRESHOLDS[kind].filter((threshold) => count >= threshold).length;
}

/** Leagues are matched by id, or by name for sources that do not identify them. */
const leagueKey = (card: CatalogCard): string => String(card.league.eaId ?? card.league.name);

class Counter {
  private readonly counts = new Map<string, number>();

  add(key: string, amount: number): void {
    this.counts.set(key, (this.counts.get(key) ?? 0) + amount);
  }

  /** Adds `amount` to every key counted so far. */
  addToAll(amount: number): void {
    for (const key of this.counts.keys()) this.add(key, amount);
  }

  get(key: string): number {
    return this.counts.get(key) ?? 0;
  }
}

/** The chemistry of a starting XI in a formation (PRD §7.1). */
export function squadChemistry(
  formation: Formation,
  starters: readonly (CatalogCard | null)[],
  manager: Manager | null = null,
): SquadChemistry {
  if (starters.length !== formation.slots.length) {
    throw new Error(
      `The ${formation.name} formation has ${formation.slots.length} slots, got ${starters.length} starters`,
    );
  }
  // Only players in a position they can play earn chemistry and count toward it.
  const inPosition = formation.slots.map((slot, index) => {
    const card = starters[index] ?? null;
    return card !== null && canPlay(card, slot.position) ? card : null;
  });
  const counted = inPosition.filter((card) => card !== null);

  const clubs = new Counter();
  const leagues = new Counter();
  const nations = new Counter();
  for (const card of counted) {
    if (card.club) clubs.add(String(card.club.eaId), 1 + card.chemistry.extraClubChemistry);
    leagues.add(leagueKey(card), 1 + card.chemistry.extraLeagueChemistry);
    nations.add(String(card.nation.eaId), 1 + card.chemistry.extraNationChemistry);
  }
  // Icons count toward every league (or nation) of the squad, after the regular counts.
  for (const card of counted) {
    if (card.chemistry.countsForEveryLeague) leagues.addToAll(1);
    if (card.chemistry.countsForEveryNation) nations.addToAll(1);
  }
  if (manager) {
    leagues.add(String(manager.leagueEaId), 1);
    nations.add(String(manager.nationEaId), 1);
  }

  const players = inPosition.map((card) => {
    if (card === null) return 0;
    const points =
      (card.chemistry.fullChemistryInPosition ? MAX_PLAYER_CHEMISTRY : 0) +
      (card.club ? chemistryPoints('club', clubs.get(String(card.club.eaId))) : 0) +
      chemistryPoints('league', leagues.get(leagueKey(card))) +
      chemistryPoints('nation', nations.get(String(card.nation.eaId)));
    return Math.min(MAX_PLAYER_CHEMISTRY, points);
  });
  return { players, total: players.reduce((sum, value) => sum + value, 0) };
}
