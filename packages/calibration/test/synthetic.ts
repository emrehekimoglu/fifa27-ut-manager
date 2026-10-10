import futggPage from '../../data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { ACCELERATE_TYPES, parseFutggDefinitionsPage } from '@fc27/data-sync';
import type { Attributes, CatalogCard, Position } from '@fc27/data-sync';
import { POSITION_GROUP, stylesFor, TRUE_RATING_RULES, trueRatingTerms } from '@fc27/domain';
import type { GroupWeights, PositionGroup, TrueRatingRules, TrueRatingTerms } from '@fc27/domain';

import { METARANK_ROLE_POSITIONS } from '../src/metarank.js';
import type { MetarankScore } from '../src/metarank.js';
import type { Sample } from '../src/sample-file.js';

const [, kubo, courtois] = parseFutggDefinitionsPage(futggPage).cards as [
  CatalogCard,
  CatalogCard,
  CatalogCard,
];

const outfield = (
  attributes: GroupWeights['attributes'],
  accelerate: number,
  height: number,
): GroupWeights => ({
  attributes,
  weakFoot: 0.3,
  skillMoves: 0.2,
  accelerate,
  height,
  playStyles: 0.2,
});

/** Known weights the synthetic references are made from, on the fit's 0.005 and 0.01 grids. */
export const TRUTH: TrueRatingRules = {
  ...TRUE_RATING_RULES,
  playStylePlusMultiplier: 2.5,
  groups: {
    GK: {
      attributes: { gkDiving: 0.4, gkReflexes: 0.35, gkPositioning: 0.25 },
      weakFoot: 0,
      skillMoves: 0,
      accelerate: 0,
      height: 0.8,
      playStyles: 0.3,
    },
    CB: outfield({ defensiveAwareness: 0.4, standingTackle: 0.3, strength: 0.3 }, -0.5, 0.6),
    FB: outfield({ sprintSpeed: 0.35, standingTackle: 0.35, crossing: 0.3 }, 0.4, 0),
    CDM: outfield({ interceptions: 0.5, shortPassing: 0.25, stamina: 0.25 }, 0, 0.3),
    CM: outfield({ shortPassing: 0.4, vision: 0.3, ballControl: 0.3 }, 0.2, 0),
    CAM: outfield({ vision: 0.35, dribbling: 0.35, longShots: 0.3 }, 0.6, -0.2),
    WM: outfield({ crossing: 0.4, acceleration: 0.3, dribbling: 0.3 }, 0.8, -0.3),
    W: outfield({ dribbling: 0.45, acceleration: 0.3, finishing: 0.25 }, 1, -0.4),
    ST: outfield({ finishing: 0.5, positioning: 0.3, strength: 0.2 }, 0.5, 0.4),
  },
};

const POSITION_OF: Readonly<Record<PositionGroup, Position>> = {
  GK: 'GK',
  CB: 'CB',
  FB: 'RB',
  CDM: 'CDM',
  CM: 'CM',
  CAM: 'CAM',
  WM: 'RM',
  W: 'RW',
  ST: 'ST',
};

/** Deterministic pseudo-random numbers in [0, 1) (mulberry32). */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PLAY_STYLE_IDS = Object.keys(TRUE_RATING_RULES.playStyleRelevance).map(Number);

/** `count` random cards per group, playing only that group's position. */
export function syntheticCards(count: number, seed = 1): CatalogCard[] {
  const next = random(seed);
  const between = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  return (Object.keys(POSITION_OF) as PositionGroup[]).flatMap((group, groupIndex) =>
    Array.from({ length: count }, (_, index): CatalogCard => {
      const base = group === 'GK' ? courtois : kubo;
      const attributes = Object.fromEntries(
        Object.keys(base.attributes).map((key) => [key, between(30, 95)]),
      ) as unknown as Attributes;
      const playStyles = PLAY_STYLE_IDS.filter(() => next() < 0.15);
      return {
        ...base,
        eaId: 1000 * (groupIndex + 1) + index,
        position: POSITION_OF[group],
        alternatePositions: [],
        attributes,
        weakFoot: between(1, 5),
        skillMoves: between(1, 5),
        heightCm: between(160, 200),
        accelerateType: ACCELERATE_TYPES[between(0, 6)] ?? 'controlled',
        accelerateTypeByStyle: null,
        playStyles: playStyles.filter((_, k) => k % 3 !== 0),
        playStylesPlus: playStyles.filter((_, k) => k % 3 === 0),
        rolesPlus: [],
        rolesPlusPlus: [],
      };
    }),
  );
}

/** The true rating of the terms under the truth, unrounded and uncapped. */
export function exactRating(terms: TrueRatingTerms, weights: GroupWeights, plusMultiplier: number) {
  const base = Object.entries(weights.attributes).reduce(
    (sum, [key, weight]) => sum + weight * terms.attributes[key as keyof Attributes],
    0,
  );
  return (
    base +
    weights.weakFoot * terms.weakFoot +
    weights.skillMoves * terms.skillMoves +
    weights.accelerate * terms.accelerate +
    weights.height * terms.height +
    weights.playStyles * (terms.playStyles + plusMultiplier * terms.playStylesPlus) +
    terms.role
  );
}

const FIRST_ROLE: Partial<Record<Position, number>> = {};
for (const [role, position] of Object.entries(METARANK_ROLE_POSITIONS)) {
  FIRST_ROLE[position] ??= Number(role);
}

/** Meta ratings that follow the truth exactly, one per style the card can use. */
export function syntheticScores(card: CatalogCard): MetarankScore[] {
  const weights = TRUTH.groups[POSITION_GROUP[card.position]];
  return stylesFor(card).map((style) => ({
    role: FIRST_ROLE[card.position] ?? 0,
    chemistryStyle: style.id,
    score: exactRating(
      trueRatingTerms(card, card.position, style, 3),
      weights,
      TRUTH.playStylePlusMultiplier,
    ),
  }));
}

export function syntheticSample(count: number): Sample {
  const cards = syntheticCards(count);
  return {
    takenAt: '2026-10-09T08:00:00.000Z',
    cards,
    metarank: Object.fromEntries(cards.map((card) => [String(card.eaId), syntheticScores(card)])),
  };
}
