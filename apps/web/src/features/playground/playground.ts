import type { AccelerateType, CatalogCard, Position } from '@fc27/data-sync';
import {
  CHEMISTRY_STYLES,
  FORMATIONS,
  accelerateTypeWith,
  applyChemistryStyle,
  canPlay,
  squadChemistry,
  squadRating,
  TRUE_RATING_RULES,
} from '@fc27/domain';
import type { CardStats, ChemistryStyle, Formation, TrueRatingRules } from '@fc27/domain';

/** A chemistry style id, 'auto' for the best style at the player's chemistry, or null for none. */
export type StyleChoice = number | 'auto' | null;

export interface PlaygroundSlot {
  readonly card: CatalogCard | null;
  readonly styleId: StyleChoice;
}

/** A starting XI being tried out: a formation and one entry per slot. */
export interface Playground {
  readonly formationId: number;
  readonly slots: readonly PlaygroundSlot[];
}

/** 4-3-3, the formation a new playground starts with. */
export const DEFAULT_FORMATION_ID = 8;

export interface EvaluatedSlot {
  readonly code: string;
  readonly position: Position;
  readonly card: CatalogCard | null;
  readonly styleId: StyleChoice;
  /** The style in effect: the chosen one, or the automatic one; null for none. */
  readonly style: ChemistryStyle | null;
  /** Whether the card can play the slot's position; false for an empty slot. */
  readonly inPosition: boolean;
  readonly chemistry: number;
  /** The card's stats with its chemistry style applied; null for an empty slot. */
  readonly stats: CardStats | null;
  /** The AcceleRATE type with the chosen style at the player's chemistry; null when unknown. */
  readonly accelerateType: AccelerateType | null;
  /** The true rating at the slot's position with the style in effect; null for an empty slot. */
  readonly trueRating: number | null;
}

export interface Evaluation {
  readonly formation: Formation;
  readonly slots: readonly EvaluatedSlot[];
  /** Squad chemistry, 0–33. */
  readonly chemistry: number;
  readonly rating: number;
  /** The squad true rating, one decimal. */
  readonly trueRating: number;
}

const EMPTY_SLOT: PlaygroundSlot = { card: null, styleId: null };

function formationOf(id: number): Formation {
  const formation = FORMATIONS.find((candidate) => candidate.id === id);
  if (!formation) throw new Error(`Unknown formation ${id}`);
  return formation;
}

export function newPlayground(formationId: number = DEFAULT_FORMATION_ID): Playground {
  const { slots } = formationOf(formationId);
  return { formationId, slots: slots.map(() => EMPTY_SLOT) };
}

function withSlot(playground: Playground, index: number, slot: PlaygroundSlot): Playground {
  return {
    ...playground,
    slots: playground.slots.map((current, at) => (at === index ? slot : current)),
  };
}

/** Puts a card into a slot; its chemistry style starts empty. */
export function placeCard(playground: Playground, index: number, card: CatalogCard): Playground {
  return withSlot(playground, index, { card, styleId: null });
}

export function removeCard(playground: Playground, index: number): Playground {
  return withSlot(playground, index, EMPTY_SLOT);
}

export function chooseStyle(
  playground: Playground,
  index: number,
  styleId: StyleChoice,
): Playground {
  const current = playground.slots[index] ?? EMPTY_SLOT;
  return withSlot(playground, index, { ...current, styleId });
}

/** Switches the formation; every card and style stays in its slot number. */
export function changeFormation(playground: Playground, formationId: number): Playground {
  formationOf(formationId);
  return { ...playground, formationId };
}

const styleOf = (styleId: StyleChoice) =>
  CHEMISTRY_STYLES.find((candidate) => candidate.id === styleId) ?? null;

function statsOf(card: CatalogCard, styleId: StyleChoice, chemistry: number): CardStats {
  const style = styleOf(styleId);
  return style
    ? applyChemistryStyle(card, style, chemistry)
    : {
        attributes: card.attributes,
        faceStats: card.faceStats,
        goalkeeperFaceStats: card.goalkeeperFaceStats,
      };
}

/** Chemistry, squad rating and boosted stats of the playground's XI. */
export function evaluate(
  playground: Playground,
  _rules: TrueRatingRules = TRUE_RATING_RULES,
): Evaluation {
  const formation = formationOf(playground.formationId);
  const cards = playground.slots.map((slot) => slot.card);
  const chemistry = squadChemistry(formation, cards);
  const slots = formation.slots.map((slot, index): EvaluatedSlot => {
    const { card, styleId } = playground.slots[index] ?? EMPTY_SLOT;
    const playerChemistry = chemistry.players[index] ?? 0;
    return {
      code: slot.code,
      position: slot.position,
      card,
      styleId,
      style: null,
      inPosition: card !== null && canPlay(card, slot.position),
      chemistry: playerChemistry,
      stats: card && statsOf(card, styleId, playerChemistry),
      accelerateType: card && accelerateTypeWith(card, styleOf(styleId), playerChemistry),
      trueRating: null,
    };
  });
  return {
    formation,
    slots,
    chemistry: chemistry.total,
    rating: squadRating(cards.map((card) => card?.overall ?? null)),
    trueRating: 0,
  };
}

const VARIANT_NAMES: Readonly<Record<string, string>> = {
  Attack: 'Hücum',
  Defend: 'Savunma',
  Holding: 'Tutucu',
  Wide: 'Geniş',
  Narrow: 'Dar',
  Flat: 'Düz',
};

/** A formation's name in Turkish, e.g. "4-3-3 Hücum" for 4-3-3 Attack. */
export function formationLabel(name: string): string {
  return name.replace(/[A-Za-z]+/g, (word) => VARIANT_NAMES[word] ?? word);
}
