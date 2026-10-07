/** A full FC 27 catalog has about 20,000 cards; anything far below that is a partial fetch. */
export const MIN_CATALOG_CARDS = 15_000;
/** A new catalog may shrink by at most 5 % against the last successful sync. */
export const MAX_CATALOG_SHRINK_RATIO = 0.05;

export type CatalogSizeCheck =
  { readonly ok: true } | { readonly ok: false; readonly reason: string };

export function checkCatalogSize(
  cardCount: number,
  previousCardCount: number | null,
): CatalogSizeCheck {
  if (cardCount < MIN_CATALOG_CARDS) {
    return {
      ok: false,
      reason: `catalog has ${cardCount} cards, fewer than the minimum of ${MIN_CATALOG_CARDS}`,
    };
  }
  if (
    // Stryker disable next-line ConditionalExpression: equivalent mutant, `null * x` is 0 in JavaScript.
    previousCardCount !== null &&
    cardCount < previousCardCount * (1 - MAX_CATALOG_SHRINK_RATIO)
  ) {
    return {
      ok: false,
      reason: `catalog has ${cardCount} cards, more than 5 % fewer than the previous ${previousCardCount}`,
    };
  }
  return { ok: true };
}
