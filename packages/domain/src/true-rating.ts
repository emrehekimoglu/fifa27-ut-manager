import type { Attributes, CatalogCard, Position } from '@fc27/data-sync';

import { accelerateTypeWith } from './accelerate.js';
import { cardPlayStyles, cardRoles } from './card-traits.js';
import { applyChemistryStyle, stylesFor } from './chemistry-style.js';
import type { ChemistryStyle } from './rules/chemistry-styles.js';
import { ACCELERATE_SCALE, POSITION_GROUP, TRUE_RATING_RULES } from './rules/true-rating.js';
import type { GroupWeights, TrueRatingRules } from './rules/true-rating.js';

const MAX_RATING = 99;
const HEIGHT_REFERENCE_CM = 180;
const HEIGHT_STEP_CM = 5;
const MAX_HEIGHT_STEPS = 3;

const oneDecimal = (value: number) => Math.round(value * 10) / 10;
const clamp = (min: number, max: number, value: number) => Math.min(max, Math.max(min, value));

/** What the true-rating weights multiply, for one card, position, style and chemistry. */
export interface TrueRatingTerms {
  /** The attributes after the chemistry-style boost. */
  readonly attributes: Attributes;
  /** Weak-foot stars above 3. */
  readonly weakFoot: number;
  /** Skill-move stars above 3. */
  readonly skillMoves: number;
  /** The AcceleRATE type on the Explosive (+1) to Lengthy (−1) scale; 0 when unknown. */
  readonly accelerate: number;
  /** 5 cm steps above 180 cm, at most 3 either way; 0 when unknown. */
  readonly height: number;
  /** Summed relevance of the card's PlayStyles at the position's group. */
  readonly playStyles: number;
  /** Summed relevance of the card's PlayStyles+ at the position's group. */
  readonly playStylesPlus: number;
  /** The Role+ or Role++ bonus at the position. */
  readonly role: number;
}

export function trueRatingTerms(
  card: CatalogCard,
  position: Position,
  style: ChemistryStyle | null,
  chemistry: number,
  rules: TrueRatingRules = TRUE_RATING_RULES,
): TrueRatingTerms {
  const group = POSITION_GROUP[position];
  const accelerateType = accelerateTypeWith(card, style, chemistry);
  const relevance = (plus: boolean) =>
    (cardPlayStyles(card) ?? [])
      .filter((playStyle) => playStyle.plus === plus)
      .reduce((sum, { id }) => sum + (rules.playStyleRelevance[id]?.[group] ?? 0), 0);
  const roles = cardRoles(card, position) ?? [];
  return {
    attributes: style ? applyChemistryStyle(card, style, chemistry).attributes : card.attributes,
    weakFoot: card.weakFoot - 3,
    skillMoves: card.skillMoves - 3,
    accelerate: accelerateType === null ? 0 : ACCELERATE_SCALE[accelerateType],
    height:
      card.heightCm === null
        ? 0
        : clamp(
            -MAX_HEIGHT_STEPS,
            MAX_HEIGHT_STEPS,
            (card.heightCm - HEIGHT_REFERENCE_CM) / HEIGHT_STEP_CM,
          ),
    playStyles: relevance(false),
    playStylesPlus: relevance(true),
    role: roles.some((candidate) => candidate.plusPlus)
      ? rules.rolePlusPlusBonus
      : roles.length > 0
        ? rules.rolePlusBonus
        : 0,
  };
}

/** The true rating from its terms and the weights of the position's group (design §2). */
export function ratingFromTerms(
  terms: TrueRatingTerms,
  weights: GroupWeights,
  rules: TrueRatingRules = TRUE_RATING_RULES,
): number {
  const base = Object.entries(weights.attributes).reduce(
    (sum, [attribute, weight]) => sum + weight * terms.attributes[attribute as keyof Attributes],
    0,
  );
  const playStyles = Math.min(
    rules.playStyleCap,
    weights.playStyles * (terms.playStyles + rules.playStylePlusMultiplier * terms.playStylesPlus),
  );
  const total =
    base +
    weights.weakFoot * terms.weakFoot +
    weights.skillMoves * terms.skillMoves +
    weights.accelerate * terms.accelerate +
    weights.height * terms.height +
    playStyles +
    terms.role;
  return oneDecimal(clamp(0, MAX_RATING, total));
}

/**
 * The card's true rating at a position with a chemistry style at a chemistry,
 * 0.0–99.0 with one decimal (design §2).
 */
export function trueRating(
  card: CatalogCard,
  position: Position,
  style: ChemistryStyle | null,
  chemistry: number,
  rules: TrueRatingRules = TRUE_RATING_RULES,
): number {
  return ratingFromTerms(
    trueRatingTerms(card, position, style, chemistry, rules),
    rules.groups[POSITION_GROUP[position]],
    rules,
  );
}

/**
 * The chemistry style that gives the highest true rating at the position and chemistry;
 * ties go to the lower style id, and there is none at 0 chemistry (design §3).
 */
export function bestChemistryStyle(
  card: CatalogCard,
  position: Position,
  chemistry: number,
  rules: TrueRatingRules = TRUE_RATING_RULES,
): ChemistryStyle | null {
  if (chemistry <= 0) return null;
  let best: ChemistryStyle | null = null;
  let bestRating = -1;
  for (const style of [...stylesFor(card)].sort((a, b) => a.id - b.id)) {
    const rating = trueRating(card, position, style, chemistry, rules);
    if (rating > bestRating) {
      best = style;
      bestRating = rating;
    }
  }
  return best;
}

export interface RatedSlot {
  readonly position: Position;
  /** The player's true rating; null for an empty slot, which counts as 0. */
  readonly rating: number | null;
}

/** The positional-weight average of the starting XI's true ratings, one decimal (design §5). */
export function squadTrueRating(
  slots: readonly RatedSlot[],
  rules: TrueRatingRules = TRUE_RATING_RULES,
): number {
  let weighted = 0;
  let totalWeight = 0;
  for (const { position, rating } of slots) {
    const weight = rules.squadWeights[POSITION_GROUP[position]];
    weighted += weight * (rating ?? 0);
    totalWeight += weight;
  }
  return totalWeight === 0 ? 0 : oneDecimal(weighted / totalWeight);
}
