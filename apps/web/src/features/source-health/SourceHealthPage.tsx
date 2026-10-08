import type { SourceHealth, SourceHealthReport } from '@fc27/data-sync';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

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

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'loaded'; readonly report: SourceHealthReport };

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
      {health.sample.length > 0 && (
        <ul className="sample" aria-label="Örnek kartlar">
          {health.sample.map((card) => (
            <li key={card.eaId} className="sample__card">
              <img src={card.imageUrl} alt="" width={48} height={48} loading="lazy" />
              <span className="sample__name">{card.name}</span>{' '}
              <span className="sample__meta">
                {card.overall} · {card.position} · {card.club?.name ?? card.league.name}
              </span>
            </li>
          ))}
        </ul>
      )}
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
        Kart verisi kaynaklarının canlı durumu ve fiyat erişimi testinin sonuçları.
      </p>

      <section className="panel" aria-labelledby="card-sources-title">
        <div className="panel__header">
          <h2 id="card-sources-title">Kart verisi</h2>
          <button type="button" onClick={recheck} disabled={state.kind === 'loading'}>
            Yeniden kontrol et
          </button>
        </div>
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
        {state.kind === 'loaded' && (
          <div className="sources">
            {state.report.sources.map((health) => (
              <SourceCard key={health.source} health={health} />
            ))}
          </div>
        )}
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
