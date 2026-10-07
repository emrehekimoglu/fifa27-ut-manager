/** A full FC 27 catalog has about 20,000 cards; anything far below that is a partial fetch. */
export const MIN_CATALOG_CARDS = 15_000;
/** A new catalog may shrink by at most 5 % against the last successful sync. */
export const MAX_CATALOG_SHRINK_RATIO = 0.05;

export type CatalogSizeCheck =
  { readonly ok: true } | { readonly ok: false; readonly reason: string };

export function checkCatalogSize(
  _cardCount: number,
  _previousCardCount: number | null,
): CatalogSizeCheck {
  throw new Error('Not implemented');
}
