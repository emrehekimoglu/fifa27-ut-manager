export type PlayStyleCategory =
  'Scoring' | 'Passing' | 'Ball Control' | 'Defending' | 'Physical' | 'Goalkeeping';

export interface PlayStyle {
  /** EA's PlayStyle id, as stored in a card's `playStyles` and `playStylesPlus`. */
  readonly id: number;
  readonly name: string;
  readonly category: PlayStyleCategory;
}

/** Every FC 27 PlayStyle (source: FUT.GG, `/api/fut/playstyles/`, 2026-10-09). */
export const PLAYSTYLES: readonly PlayStyle[] = [
  { id: 1, name: 'Chip Shot', category: 'Scoring' },
  { id: 2, name: 'Power Shot', category: 'Scoring' },
  { id: 3, name: 'Dead Ball', category: 'Scoring' },
  { id: 0, name: 'Finesse Shot', category: 'Scoring' },
  { id: 6, name: 'Pinged Pass', category: 'Passing' },
  { id: 5, name: 'Incisive Pass', category: 'Passing' },
  { id: 7, name: 'Long Ball Pass', category: 'Passing' },
  { id: 8, name: 'Tiki Taka', category: 'Passing' },
  { id: 9, name: 'Whipped Pass', category: 'Passing' },
  { id: 19, name: 'First Touch', category: 'Ball Control' },
  { id: 21, name: 'Press Proven', category: 'Ball Control' },
  { id: 17, name: 'Rapid', category: 'Ball Control' },
  { id: 16, name: 'Technical', category: 'Ball Control' },
  { id: 11, name: 'Block', category: 'Defending' },
  { id: 15, name: 'Bruiser', category: 'Physical' },
  { id: 12, name: 'Intercept', category: 'Defending' },
  { id: 10, name: 'Jockey', category: 'Defending' },
  { id: 14, name: 'Slide Tackle', category: 'Defending' },
  { id: 13, name: 'Anticipate', category: 'Defending' },
  { id: 25, name: 'Acrobatic', category: 'Scoring' },
  { id: 23, name: 'Relentless', category: 'Physical' },
  { id: 22, name: 'Quick Step', category: 'Physical' },
  { id: 26, name: 'Long Throw', category: 'Physical' },
  { id: 28, name: 'Far Throw', category: 'Goalkeeping' },
  { id: 29, name: 'Footwork', category: 'Goalkeeping' },
  { id: 30, name: 'Cross Claimer', category: 'Goalkeeping' },
  { id: 31, name: '1v1 Close Down', category: 'Goalkeeping' },
  { id: 32, name: 'Far Reach', category: 'Goalkeeping' },
  { id: 33, name: 'Deflector', category: 'Goalkeeping' },
  { id: 34, name: 'Low Driven Shot', category: 'Scoring' },
  { id: 35, name: 'Aerial Fortress', category: 'Defending' },
  { id: 36, name: 'Enforcer', category: 'Physical' },
  { id: 37, name: 'Gamechanger', category: 'Scoring' },
  { id: 38, name: 'Inventive', category: 'Passing' },
  { id: 39, name: 'Precision Header', category: 'Scoring' },
  { id: 20, name: 'Trickster', category: 'Ball Control' },
];
