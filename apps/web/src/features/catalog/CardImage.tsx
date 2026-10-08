import type { CatalogCard } from '@fc27/data-sync';

/** The card's image, or a placeholder of the same size when the source has none. */
export function CardImage({ card, size }: { readonly card: CatalogCard; readonly size: number }) {
  return card.imageUrl === null ? (
    <span
      className="card-image card-image--empty"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  ) : (
    <img
      className="card-image"
      src={card.imageUrl}
      alt=""
      width={size}
      height={size}
      loading="lazy"
    />
  );
}
