import type { CardSource } from '@fc27/data-sync';

const SOURCE_NAMES: Record<CardSource, string> = {
  futgg: 'FUT.GG',
  ea: 'EA resmi API',
};

const SOURCE_ROLES: Record<CardSource, string> = {
  futgg: 'Birincil kaynak',
  ea: 'Yedek kaynak',
};

const STATUS_LABELS: Record<'ok' | 'error', string> = {
  ok: 'Çalışıyor',
  error: 'Hata',
};

export function sourceName(source: CardSource): string {
  return SOURCE_NAMES[source];
}

export function sourceRole(source: CardSource): string {
  return SOURCE_ROLES[source];
}

export function statusLabel(status: 'ok' | 'error'): string {
  return STATUS_LABELS[status];
}

/** Card count in Turkish notation; a capped total is shown as a lower bound. */
export function formatCardCount(total: number, isCapped: boolean): string {
  const formatted = new Intl.NumberFormat('tr-TR').format(total);
  return isCapped ? `${formatted}+` : formatted;
}

export function formatLatency(milliseconds: number): string {
  return milliseconds < 1000
    ? `${milliseconds} ms`
    : `${new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(milliseconds / 1000)} sn`;
}

/** Clock time of a check, in the users' time zone (Türkiye). */
export function formatCheckedAt(isoTimestamp: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Europe/Istanbul',
  }).format(new Date(isoTimestamp));
}
