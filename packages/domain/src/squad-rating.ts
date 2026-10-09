/** Starters that make up the squad rating. */
const STARTERS = 11;

/**
 * The squad rating the game shows, from the ratings of the starting XI (PRD §7.2).
 * An empty slot counts as 0.
 */
export function squadRating(ratings: readonly (number | null)[]): number {
  if (ratings.length !== STARTERS) {
    throw new Error(`A squad rating needs ${STARTERS} starters, got ${ratings.length}`);
  }
  const values = ratings.map((rating) => rating ?? 0);
  const sum = values.reduce((total, rating) => total + rating, 0);
  const average = sum / STARTERS;
  const correction = values.reduce((total, rating) => total + Math.max(0, rating - average), 0);
  return Math.floor(Math.round(sum + correction) / STARTERS);
}
