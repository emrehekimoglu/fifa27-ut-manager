import type { CatalogCard } from '@fc27/data-sync';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import { browserSupabase } from '../../lib/supabase';
import {
  accelerateByStyle,
  accelerateLabel,
  footLabel,
  playStylesLabel,
  positionName,
  rolesLabel,
  statGroups,
} from './card-labels';
import { fetchCard } from './catalog-query';
import type { StoredCard } from './catalog-query';
import { CardImage } from './CardImage';
import { trueRatingRows } from './true-rating-rows';

type Outcome =
  { readonly kind: 'failed' } | { readonly kind: 'loaded'; readonly stored: StoredCard | null };

/** The outcome of the card it belongs to, so opening another card shows as loading. */
interface Settled {
  readonly eaId: number;
  readonly outcome: Outcome;
}

/** A positive integer EA id from the address, or null. */
function eaIdFrom(value: string | undefined): number | null {
  if (value === undefined || !/^\d+$/.test(value)) return null;
  const eaId = Number(value);
  return eaId > 0 && Number.isSafeInteger(eaId) ? eaId : null;
}

function Fact({ label, children }: { readonly label: string; readonly children: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function CardFacts({ card }: { readonly card: CatalogCard }) {
  return (
    <dl className="facts">
      <Fact label="Reyting">{String(card.overall)}</Fact>
      <Fact label="Mevki">{`${card.position} · ${positionName(card.position)}`}</Fact>
      <Fact label="Diğer mevkiler">
        {card.alternatePositions.length > 0 ? card.alternatePositions.join(', ') : '—'}
      </Fact>
      <Fact label="Kart türü">{card.rarity?.name ?? '—'}</Fact>
      <Fact label="Kulüp">{card.club?.name ?? '—'}</Fact>
      <Fact label="Lig">{card.league.name}</Fact>
      <Fact label="Ülke">{card.nation.name}</Fact>
      <Fact label="Ayak">{footLabel(card.foot)}</Fact>
      <Fact label="Zayıf ayak">{String(card.weakFoot)}</Fact>
      <Fact label="Yetenek hareketi">{String(card.skillMoves)}</Fact>
      <Fact label="Boy">{card.heightCm === null ? '—' : `${card.heightCm} cm`}</Fact>
      <Fact label="Kilo">{card.weightKg === null ? '—' : `${card.weightKg} kg`}</Fact>
      <Fact label="AcceleRATE">
        {card.accelerateType === null ? '—' : accelerateLabel(card.accelerateType)}
      </Fact>
      <Fact label="PlayStyle'lar">{playStylesLabel(card)}</Fact>
      <Fact label="Roller">{rolesLabel(card)}</Fact>
      <Fact label="Takas">{card.isUntradeable ? 'Takas edilemez' : 'Takas edilebilir'}</Fact>
    </dl>
  );
}

function TrueRatings({ card }: { readonly card: CatalogCard }) {
  return (
    <section className="panel" aria-labelledby="true-rating-title">
      <h2 id="true-rating-title">Gerçek reyting</h2>
      <p className="panel__note">Tam kimyada, en iyi kimya stiliyle.</p>
      <dl className="facts">
        {trueRatingRows(card).map((row) => (
          <Fact key={row.position} label={row.position}>
            {`${row.rating} · ${row.style}`}
          </Fact>
        ))}
      </dl>
    </section>
  );
}

function AccelerateByStyle({ card }: { readonly card: CatalogCard }) {
  const rows = accelerateByStyle(card);
  if (rows === null) return null;
  return (
    <section className="panel" aria-labelledby="accelerate-by-style-title">
      <h2 id="accelerate-by-style-title">Kimya stiline göre AcceleRATE</h2>
      <dl className="facts">
        {rows.map((row) => (
          <Fact key={row.label} label={row.label}>
            {row.styles}
          </Fact>
        ))}
      </dl>
    </section>
  );
}

function CardStats({ card }: { readonly card: CatalogCard }) {
  const groups = statGroups(card);
  if (groups.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="card-stats-title">
      <h2 id="card-stats-title">İstatistikler</h2>
      <div className="stat-groups">
        {groups.map((group, index) => {
          const titleId = `stat-group-${index}`;
          return (
            <section key={group.label} className="stat-group" aria-labelledby={titleId}>
              <h3 id={titleId} className="stat-group__title">
                {group.label} <span className="stat-group__value">{group.value}</span>
              </h3>
              <dl className="stat-group__rows">
                {group.attributes.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>
    </section>
  );
}

export function CardDetailPage() {
  const eaId = eaIdFrom(useParams()['eaId']);
  const configured = browserSupabase() !== null;
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    const client = browserSupabase();
    if (!client || eaId === null) return;
    let cancelled = false;
    const settle = (outcome: Outcome) => {
      if (!cancelled) setSettled({ eaId, outcome });
    };
    fetchCard(client, eaId)
      .then((stored) => {
        settle({ kind: 'loaded', stored });
      })
      .catch(() => {
        settle({ kind: 'failed' });
      });
    return () => {
      cancelled = true;
    };
  }, [eaId]);

  const outcome: Outcome | null =
    eaId === null
      ? { kind: 'loaded', stored: null }
      : settled?.eaId === eaId
        ? settled.outcome
        : null;

  return (
    <div className="page">
      <nav className="page__nav">
        <Link to="/katalog">← Katalog</Link>
      </nav>
      {!configured && eaId !== null && (
        <p className="panel__note">Veritabanı bağlantısı yapılandırılmamış.</p>
      )}
      {configured && outcome === null && <p className="panel__note">Yükleniyor…</p>}
      {outcome?.kind === 'failed' && <p role="alert">Kart yüklenemedi.</p>}
      {outcome?.kind === 'loaded' && outcome.stored === null && (
        <p className="panel__note">Kart bulunamadı.</p>
      )}
      {outcome?.kind === 'loaded' && outcome.stored !== null && (
        <>
          <header className="card-detail__header">
            <CardImage card={outcome.stored.card} size={120} />
            <h1 className="page__title">{outcome.stored.card.name}</h1>
          </header>
          {!outcome.stored.isActive && (
            <p className="panel__note">Bu kart artık kaynakta listelenmiyor.</p>
          )}
          <section className="panel source" aria-label="Kart bilgileri">
            <CardFacts card={outcome.stored.card} />
          </section>
          <TrueRatings card={outcome.stored.card} />
          <AccelerateByStyle card={outcome.stored.card} />
          <CardStats card={outcome.stored.card} />
        </>
      )}
    </div>
  );
}
