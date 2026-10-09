export type PlayStyleCategory =
  'Scoring' | 'Passing' | 'Ball Control' | 'Defending' | 'Physical' | 'Goalkeeping';

export interface PlayStyle {
  /** EA's PlayStyle id, as stored in a card's `playStyles` and `playStylesPlus`. */
  readonly id: number;
  readonly name: string;
  readonly category: PlayStyleCategory;
}

/** Every FC 27 PlayStyle (source: FUT.GG, `/api/fut/playstyles/`, 2026-10-09). */
export const PLAYSTYLES: readonly PlayStyle[] = [];
