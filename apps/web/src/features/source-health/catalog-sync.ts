import type { SupabaseClient } from '@supabase/supabase-js';

import type { SyncRecord } from '@fc27/data-sync';

interface CatalogSyncRow {
  readonly id: number;
  readonly started_at: string;
  readonly finished_at: string | null;
  readonly status: SyncRecord['status'];
  readonly source: SyncRecord['source'];
  readonly card_count: number | null;
  readonly deactivated_count: number | null;
  readonly error: string | null;
}

const toIso = (timestamp: string) => new Date(timestamp).toISOString();

/** The most recent catalog sync, or null when none has run yet. */
export async function fetchLatestCatalogSync(client: SupabaseClient): Promise<SyncRecord | null> {
  const { data, error } = await client
    .from('catalog_syncs')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .overrideTypes<CatalogSyncRow[], { merge: false }>();
  if (error) throw new Error(error.message);
  const row = data[0];
  if (!row) return null;
  return {
    id: row.id,
    startedAt: toIso(row.started_at),
    finishedAt: row.finished_at === null ? null : toIso(row.finished_at),
    status: row.status,
    source: row.source,
    cardCount: row.card_count,
    deactivatedCount: row.deactivated_count,
    error: row.error,
  } as SyncRecord;
}

const STATUS_LABELS: Record<SyncRecord['status'], string> = {
  succeeded: 'Başarılı',
  failed: 'Başarısız',
  running: 'Çalışıyor',
};

export function syncStatusLabel(status: SyncRecord['status']): string {
  return STATUS_LABELS[status];
}

/** Date and time of a sync in the users' time zone (Türkiye), e.g. "7 Ekim 2026 06:47". */
export function formatSyncTime(isoTimestamp: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Europe/Istanbul',
  }).format(new Date(isoTimestamp));
}
