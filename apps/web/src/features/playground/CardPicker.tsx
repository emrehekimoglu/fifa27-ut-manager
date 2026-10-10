import type { CatalogCard, Position } from '@fc27/data-sync';
import { useEffect, useRef, useState } from 'react';

import { browserSupabase } from '../../lib/supabase';
import { CardImage } from '../catalog/CardImage';
import { searchCatalog } from '../catalog/catalog-query';

/** Wait after the last keystroke before searching. */
const SEARCH_DELAY_MS = 300;

type Outcome =
  { readonly kind: 'failed' } | { readonly kind: 'loaded'; readonly cards: readonly CatalogCard[] };

interface Settled {
  readonly query: string;
  readonly outcome: Outcome;
}

interface CardPickerProps {
  readonly slotCode: string;
  readonly position: Position;
  readonly onPick: (card: CatalogCard) => void;
  readonly onClose: () => void;
}

/** A modal search for a card that can play the slot's position, best first. */
export function CardPicker({ slotCode, position, onPick, onClose }: CardPickerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [settled, setSettled] = useState<Settled | null>(null);
  const configured = browserSupabase() !== null;

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(draft.trim());
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [draft]);

  useEffect(() => {
    const client = browserSupabase();
    if (!client) return;
    let cancelled = false;
    const settle = (outcome: Outcome) => {
      if (!cancelled) setSettled({ query, outcome });
    };
    searchCatalog(client, { query, position, page: 1 })
      .then((result) => {
        settle({ kind: 'loaded', cards: result.cards });
      })
      .catch(() => {
        settle({ kind: 'failed' });
      });
    return () => {
      cancelled = true;
    };
  }, [query, position]);

  const outcome = settled?.query === query ? settled.outcome : null;

  return (
    <dialog ref={dialog} className="picker" aria-label={`Kart seç · ${slotCode}`} onClose={onClose}>
      <div className="picker__header">
        <h2 className="picker__title">Kart seç · {slotCode}</h2>
        <button type="button" onClick={onClose}>
          Kapat
        </button>
      </div>
      <label className="field">
        <span>Oyuncu ara</span>
        <input
          type="search"
          value={draft}
          placeholder="Örn. Mbappé"
          autoComplete="off"
          onChange={(event) => {
            setDraft(event.target.value);
          }}
        />
      </label>
      {!configured && <p className="panel__note">Veritabanı bağlantısı yapılandırılmamış.</p>}
      {configured && outcome === null && <p className="panel__note">Yükleniyor…</p>}
      {outcome?.kind === 'failed' && <p role="alert">Kartlar yüklenemedi.</p>}
      {outcome?.kind === 'loaded' &&
        (outcome.cards.length === 0 ? (
          <p className="panel__note">Bu mevkide oynayabilen kart bulunamadı.</p>
        ) : (
          <ul className="picker__results" aria-label="Sonuçlar">
            {outcome.cards.map((card) => (
              <li key={card.eaId}>
                <button
                  type="button"
                  className="picker__card"
                  onClick={() => {
                    onPick(card);
                  }}
                >
                  <CardImage card={card} size={40} />
                  <span>
                    {card.name} {card.overall} · {card.position} ·{' '}
                    {card.club?.name ?? card.league.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ))}
    </dialog>
  );
}
