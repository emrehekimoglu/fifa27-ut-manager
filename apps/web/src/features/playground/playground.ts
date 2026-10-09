import type { AccelerateType, CatalogCard, Position } from '@fc27/data-sync';
import {
  CHEMISTRY_STYLES,
  FORMATIONS,
  applyChemistryStyle,
  canPlay,
  squadChemistry,
  squadRating,
} from '@fc27/domain';
import type { CardStats, Formation } from '@fc27/domain';

export interface PlaygroundSlot {
  readonly card: CatalogCard | null;
  /** The chosen chemistry style, or null for none. */
  readonly styleId: number | null;
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
  readonly styleId: number | null;
  /** Whether the card can play the slot's position; false for an empty slot. */
  readonly inPosition: boolean;
  readonly chemistry: number;
  /** The card's stats with its chemistry style applied; null for an empty slot. */
  readonly stats: CardStats | null;
  /** The AcceleRATE type with the chosen style at the player's chemistry; null when unknown. */
  readonly accelerateType: AccelerateType | null;
}

export interface Evaluation {
  readonly formation: Formation;
  readonly slots: readonly EvaluatedSlot[];
  /** Squad chemistry, 0–33. */
  readonly chemistry: number;
  readonly rating: number;
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
  styleId: number | null,
): Playground {
  const current = playground.slots[index] ?? EMPTY_SLOT;
  return withSlot(playground, index, { ...current, styleId });
}

/** Switches the formation; every card and style stays in its slot number. */
export function changeFormation(playground: Playground, formationId: number): Playground {
  formationOf(formationId);
  return { ...playground, formationId };
}

function statsOf(card: CatalogCard, styleId: number | null, chemistry: number): CardStats {
  const style = CHEMISTRY_STYLES.find((candidate) => candidate.id === styleId);
  return style
    ? applyChemistryStyle(card, style, chemistry)
    : {
        attributes: card.attributes,
        faceStats: card.faceStats,
        goalkeeperFaceStats: card.goalkeeperFaceStats,
      };
}

/** Chemistry, squad rating and boosted stats of the playground's XI. */
export function evaluate(playground: Playground): Evaluation {
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
      inPosition: card !== null && canPlay(card, slot.position),
      chemistry: playerChemistry,
      stats: card && statsOf(card, styleId, playerChemistry),
      accelerateType: null,
    };
  });
  return {
    formation,
    slots,
    chemistry: chemistry.total,
    rating: squadRating(cards.map((card) => card?.overall ?? null)),
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
