import { POSITIONS } from '@fc27/data-sync';
import type { Position } from '@fc27/data-sync';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { browserSupabase } from '../../lib/supabase';
import { formatCardCount } from '../source-health/format';
import { positionName } from './card-labels';
import { CATALOG_PAGE_SIZE, searchCatalog } from './catalog-query';
import type { CatalogResultPage } from './catalog-query';
import { CardImage } from './CardImage';

/** Wait after the last keystroke before searching. */
const SEARCH_DELAY_MS = 300;

type Outcome =
  { readonly kind: 'failed' } | { readonly kind: 'loaded'; readonly result: CatalogResultPage };

/** The outcome of the search it belongs to, so a newer search shows as loading. */
interface Settled {
  readonly key: string;
  readonly outcome: Outcome;
}

const isPosition = (value: string | null): value is Position =>
  value !== null && (POSITIONS as readonly string[]).includes(value);

function pageFrom(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

interface AddressChange {
  readonly q?: string;
  readonly mevki?: Position | null;
  readonly sayfa?: number;
}

/** Applies a change to the address; a new search or filter starts again at page 1. */
function changed(previous: URLSearchParams, change: AddressChange): URLSearchParams {
  const next = new URLSearchParams(previous);
  const set = (key: string, value: string | null) => {
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
  };
  if (change.q !== undefined) set('q', change.q.trim());
  if (change.mevki !== undefined) set('mevki', change.mevki);
  const sayfa = change.sayfa ?? 1;
  set('sayfa', sayfa > 1 ? String(sayfa) : null);
  return next;
}

export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const mevki = params.get('mevki');
  const position = isPosition(mevki) ? mevki : null;
  const page = pageFrom(params.get('sayfa'));
  const searchKey = JSON.stringify([query, position, page]);

  const [draft, setDraft] = useState(query);
  const [shownQuery, setShownQuery] = useState(query);
  if (query !== shownQuery) {
    // The address changed (e.g. back button): show its search text.
    setShownQuery(query);
    if (draft.trim() !== query) setDraft(query);
  }
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [settled, setSettled] = useState<Settled | null>(null);
  const configured = browserSupabase() !== null;

  const update = (change: AddressChange) => {
    setParams((previous) => changed(previous, change), { replace: change.q !== undefined });
  };

  useEffect(
    () => () => {
      clearTimeout(typingTimer.current);
    },
    [],
  );

  useEffect(() => {
    const client = browserSupabase();
    if (!client) return;
    let cancelled = false;
    const settle = (outcome: Outcome) => {
      if (!cancelled) setSettled({ key: searchKey, outcome });
    };
    searchCatalog(client, { query, position, page })
      .then((result) => {
        settle({ kind: 'loaded', result });
      })
      .catch(() => {
        settle({ kind: 'failed' });
      });
    return () => {
      cancelled = true;
    };
  }, [searchKey, query, position, page]);

  const outcome = settled?.key === searchKey ? settled.outcome : null;
  const state = !configured
    ? { kind: 'unconfigured' as const }
    : (outcome ?? { kind: 'loading' as const });
  const pageCount =
    state.kind === 'loaded' ? Math.max(1, Math.ceil(state.result.total / CATALOG_PAGE_SIZE)) : 1;

  return (
    <div className="page">
      <h1 className="page__title">Kart kataloğu</h1>
      <p className="page__lead">FC 27 Ultimate Team kartları, en yüksek reytingden başlayarak.</p>

      <form
        className="catalog-filters"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          clearTimeout(typingTimer.current);
          update({ q: draft });
        }}
      >
        <label className="field">
          <span>Oyuncu ara</span>
          <input
            type="search"
            value={draft}
            placeholder="Örn. Mbappé"
            autoComplete="off"
            onChange={(event) => {
              const { value } = event.target;
              setDraft(value);
              clearTimeout(typingTimer.current);
              typingTimer.current = setTimeout(() => {
                update({ q: value });
              }, SEARCH_DELAY_MS);
            }}
          />
        </label>
        <label className="field">
          <span>Mevki</span>
          <select
            value={position ?? ''}
            onChange={(event) => {
              const { value } = event.target;
              update({ mevki: isPosition(value) ? value : null });
            }}
          >
            <option value="">Tüm mevkiler</option>
            {POSITIONS.map((code) => (
              <option key={code} value={code}>
                {code} · {positionName(code)}
              </option>
            ))}
          </select>
        </label>
      </form>

      <section className="panel" aria-labelledby="catalog-results-title">
        <h2 id="catalog-results-title" className="visually-hidden">
          Sonuçlar
        </h2>
        {state.kind === 'loading' && <p className="panel__note">Yükleniyor…</p>}
        {state.kind === 'unconfigured' && (
          <p className="panel__note">Veritabanı bağlantısı yapılandırılmamış.</p>
        )}
        {state.kind === 'failed' && <p role="alert">Kartlar yüklenemedi.</p>}
        {state.kind === 'loaded' && (
          <>
            <p className="panel__note" role="status">
              {formatCardCount(state.result.total, false)} kart
            </p>
            {state.result.cards.length === 0 ? (
              <p className="panel__note">Aramanızla eşleşen kart yok.</p>
            ) : (
              <ul className="catalog-list" aria-label="Kartlar">
                {state.result.cards.map((card) => (
                  <li key={card.eaId}>
                    <Link className="catalog-list__card" to={`/katalog/${card.eaId}`}>
                      <CardImage card={card} size={48} />
                      <span className="sample__name">{card.name}</span>{' '}
                      <span className="sample__meta">
                        <span className="rating-chip">{card.overall}</span> · {card.position} ·{' '}
                        {card.club?.name ?? card.league.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <nav className="pager" aria-label="Sayfalar">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  update({ sayfa: page - 1 });
                }}
              >
                Önceki
              </button>
              <span>
                Sayfa {Math.min(page, pageCount)} / {pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => {
                  update({ sayfa: page + 1 });
                }}
              >
                Sonraki
              </button>
            </nav>
          </>
        )}
      </section>
    </div>
  );
}
