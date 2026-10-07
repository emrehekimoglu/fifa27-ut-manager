import type { SyncRecord } from '@fc27/data-sync';
import { useEffect, useState } from 'react';

import { browserSupabase } from '../../lib/supabase';
import { fetchLatestCatalogSync, formatSyncTime, syncStatusLabel } from './catalog-sync';
import { formatCardCount, sourceName } from './format';

type SyncState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unconfigured' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'loaded'; readonly sync: SyncRecord | null };

function SyncFacts({ sync }: { readonly sync: SyncRecord }) {
  return (
    <dl className="source__facts">
      <div>
        <dt>Durum</dt>
        <dd className={`status status--${sync.status === 'failed' ? 'error' : 'ok'}`}>
          {syncStatusLabel(sync.status)}
        </dd>
      </div>
      <div>
        <dt>Son çalışma</dt>
        <dd>{formatSyncTime(sync.startedAt)}</dd>
      </div>
      <div>
        <dt>Kaynak</dt>
        <dd>{sync.source ? sourceName(sync.source) : '—'}</dd>
      </div>
      <div>
        <dt>Kart sayısı</dt>
        <dd>{typeof sync.cardCount === 'number' ? formatCardCount(sync.cardCount, false) : '—'}</dd>
      </div>
      <div>
        <dt>Pasife alınan kart</dt>
        <dd>{sync.deactivatedCount ?? '—'}</dd>
      </div>
      {sync.error && (
        <div className="source__error">
          <dt>Hata ayrıntısı</dt>
          <dd>{sync.error}</dd>
        </div>
      )}
    </dl>
  );
}

/** Latest run of the daily catalog sync (ADR-0005). */
export function CatalogSyncSection() {
  const [state, setState] = useState<SyncState>(() =>
    browserSupabase() ? { kind: 'loading' } : { kind: 'unconfigured' },
  );

  useEffect(() => {
    const client = browserSupabase();
    if (!client) return;
    let cancelled = false;
    fetchLatestCatalogSync(client)
      .then((sync) => {
        if (!cancelled) setState({ kind: 'loaded', sync });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'failed' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="panel source" aria-labelledby="catalog-sync-title">
      <h2 id="catalog-sync-title">Katalog senkronizasyonu</h2>
      {state.kind === 'loading' && <p className="panel__note">Yükleniyor…</p>}
      {state.kind === 'unconfigured' && (
        <p className="panel__note">Veritabanı bağlantısı yapılandırılmamış.</p>
      )}
      {state.kind === 'failed' && <p role="alert">Senkronizasyon durumu alınamadı.</p>}
      {state.kind === 'loaded' &&
        (state.sync ? (
          <SyncFacts sync={state.sync} />
        ) : (
          <p className="panel__note">Henüz bir katalog senkronizasyonu çalışmadı.</p>
        ))}
    </section>
  );
}
