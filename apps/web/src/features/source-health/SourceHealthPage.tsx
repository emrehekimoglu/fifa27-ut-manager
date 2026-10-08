import type { CatalogCard, SourceHealth, SourceHealthReport } from '@fc27/data-sync';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { browserSupabase } from '../../lib/supabase';
import { formatSyncTime } from './catalog-sync';

import {
  formatCardCount,
  formatCheckedAt,
  formatLatency,
  sourceName,
  sourceRole,
  statusLabel,
} from './format';
import { CatalogSyncSection } from './CatalogSyncSection';
import { PRICE_ACCESS_RESULTS, PRICE_ACCESS_TESTED_ON } from './price-access';
import { fetchStoredFutggCatalog } from './stored-catalog';
import type { StoredFutggCatalog } from './stored-catalog';

/** Sample cards shown per source. */
const SAMPLE_SIZE = 3;

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'loaded'; readonly report: SourceHealthReport };

function SampleCards({ cards }: { readonly cards: readonly CatalogCard[] }) {
  if (cards.length === 0) return null;
  return (
    <ul className="sample" aria-label="Örnek kartlar">
      {cards.map((card) => (
        <li key={card.eaId} className="sample__card">
          {card.imageUrl === null ? (
            <span className="sample__placeholder" aria-hidden="true" />
          ) : (
            <img src={card.imageUrl} alt="" width={48} height={48} loading="lazy" />
          )}
          <span className="sample__name">{card.name}</span>{' '}
          <span className="sample__meta">
            {card.overall} · {card.position} · {card.club?.name ?? card.league.name}
          </span>
        </li>
      ))}
    </ul>
  );
}

type StoredState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unconfigured' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'loaded'; readonly catalog: StoredFutggCatalog };

function StoredFutggFacts({ catalog }: { readonly catalog: StoredFutggCatalog }) {
  return (
    <>
      <dl className="source__facts">
        <div>
          <dt>Durum</dt>
          <dd className={`status status--${catalog.status ?? 'ok'}`}>
            {catalog.status === null ? 'Henüz veri yok' : statusLabel(catalog.status)}
          </dd>
        </div>
        <div>
          <dt>Kart sayısı</dt>
          <dd>{formatCardCount(catalog.activeCardCount, false)}</dd>
        </div>
        <div>
          <dt>Son başarılı çekim</dt>
          <dd>{catalog.lastFetchedAt === null ? '—' : formatSyncTime(catalog.lastFetchedAt)}</dd>
        </div>
        {catalog.error !== null && (
          <div className="source__error">
            <dt>Hata ayrıntısı</dt>
            <dd>{catalog.error}</dd>
          </div>
        )}
      </dl>
      <SampleCards cards={catalog.sample} />
    </>
  );
}

/** FUT.GG as seen through the catalog stored by the daily sync (ADR-0005). */
function StoredFutggCard() {
  const [state, setState] = useState<StoredState>(() =>
    browserSupabase() ? { kind: 'loading' } : { kind: 'unconfigured' },
  );

  useEffect(() => {
    const client = browserSupabase();
    if (!client) return;
    let cancelled = false;
    fetchStoredFutggCatalog(client, SAMPLE_SIZE)
      .then((catalog) => {
        if (!cancelled) setState({ kind: 'loaded', catalog });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'failed' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="source" aria-labelledby="source-futgg">
      <header className="source__header">
        <h3 id="source-futgg">{sourceName('futgg')}</h3>
        <span className="badge">{sourceRole('futgg')}</span>
      </header>
      <p className="panel__note">
        FUT.GG verisi her gün GitHub üzerinden çekilip veritabanına kaydediliyor. Burada kaydedilen
        veri gösteriliyor.
      </p>
      {state.kind === 'loading' && <p className="panel__note">Yükleniyor…</p>}
      {state.kind === 'unconfigured' && (
        <p className="panel__note">Veritabanı bağlantısı yapılandırılmamış.</p>
      )}
      {state.kind === 'failed' && <p role="alert">FUT.GG verisi alınamadı.</p>}
      {state.kind === 'loaded' && <StoredFutggFacts catalog={state.catalog} />}
    </section>
  );
}

function SourceCard({ health }: { readonly health: SourceHealth }) {
  const titleId = `source-${health.source}`;
  return (
    <section className="source" aria-labelledby={titleId}>
      <header className="source__header">
        <h3 id={titleId}>{sourceName(health.source)}</h3>
        <span className="badge">{sourceRole(health.source)}</span>
      </header>
      <dl className="source__facts">
        <div>
          <dt>Durum</dt>
          <dd className={`status status--${health.status}`}>{statusLabel(health.status)}</dd>
        </div>
        <div>
          <dt>Yanıt süresi</dt>
          <dd>{formatLatency(health.latencyMs)}</dd>
        </div>
        <div>
          <dt>Kart sayısı</dt>
          <dd>
            {health.totalCards === null
              ? '—'
              : formatCardCount(health.totalCards, health.totalIsCapped)}
          </dd>
        </div>
        <div>
          <dt>Kontrol saati</dt>
          <dd>{formatCheckedAt(health.checkedAt)}</dd>
        </div>
        {health.error !== null && (
          <div className="source__error">
            <dt>Hata ayrıntısı</dt>
            <dd>{health.error}</dd>
          </div>
        )}
      </dl>
      <SampleCards cards={health.sample} />
    </section>
  );
}

function PriceAccessTable() {
  return (
    <div className="table-scroll">
      <table className="price-table">
        <caption>Fiyat erişimi testi ({PRICE_ACCESS_TESTED_ON})</caption>
        <thead>
          <tr>
            <th scope="col">Kaynak</th>
            <th scope="col">Sunucudan</th>
            <th scope="col">Ev bilgisayarından</th>
            <th scope="col">Karar</th>
          </tr>
        </thead>
        <tbody>
          {PRICE_ACCESS_RESULTS.map((result) => (
            <tr key={result.source}>
              <th scope="row">{result.source}</th>
              <td>{result.fromServer}</td>
              <td>{result.fromHome}</td>
              <td>{result.decision}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SourceHealthPage() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/source-health', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const report = (await response.json()) as SourceHealthReport;
        setState({ kind: 'loaded', report });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ kind: 'failed' });
      });
    return () => {
      controller.abort();
    };
  }, [attempt]);

  const recheck = () => {
    setState({ kind: 'loading' });
    setAttempt((current) => current + 1);
  };

  return (
    <main className="page">
      <nav className="page__nav">
        <Link to="/">← Ana sayfa</Link>
      </nav>
      <h1 className="page__title">Veri kaynakları</h1>
      <p className="page__lead">
        Kart verisi kaynaklarının durumu ve fiyat erişimi testinin sonuçları.
      </p>

      <section className="panel" aria-labelledby="card-sources-title">
        <div className="panel__header">
          <h2 id="card-sources-title">Kart verisi</h2>
          <button type="button" onClick={recheck} disabled={state.kind === 'loading'}>
            Yeniden kontrol et
          </button>
        </div>
        <div className="sources">
          <StoredFutggCard />
          {state.kind === 'loading' && (
            <p className="panel__note" role="status">
              Kaynaklar kontrol ediliyor…
            </p>
          )}
          {state.kind === 'failed' && (
            <div className="panel__failure">
              <p role="alert">Kaynak durumu alınamadı.</p>
              <button type="button" onClick={recheck}>
                Tekrar dene
              </button>
            </div>
          )}
          {state.kind === 'loaded' &&
            state.report.sources.map((health) => (
              <SourceCard key={health.source} health={health} />
            ))}
        </div>
      </section>

      <CatalogSyncSection />

      <section className="panel" aria-labelledby="price-access-title">
        <h2 id="price-access-title">Fiyat erişimi</h2>
        <p className="panel__note">
          FUT.GG fiyatları sunuculara göstermiyor, ev internetinden açılan tarayıcıya gösteriyor. Bu
          yüzden fiyatlar M5&apos;te ev bilgisayarında çalışacak bir fiyat ajanıyla alınacak.
        </p>
        <PriceAccessTable />
      </section>
    </main>
  );
}
