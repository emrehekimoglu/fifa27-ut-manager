import type { CardSource } from '@fc27/data-sync';

export function sourceName(_source: CardSource): string {
  throw new Error('Not implemented');
}

export function sourceRole(_source: CardSource): string {
  throw new Error('Not implemented');
}

export function statusLabel(_status: 'ok' | 'error'): string {
  throw new Error('Not implemented');
}

/** Card count in Turkish notation; a capped total is shown as a lower bound. */
export function formatCardCount(_total: number, _isCapped: boolean): string {
  throw new Error('Not implemented');
}

export function formatLatency(_milliseconds: number): string {
  throw new Error('Not implemented');
}

/** Clock time of a check, in the users' time zone (Türkiye). */
export function formatCheckedAt(_isoTimestamp: string): string {
  throw new Error('Not implemented');
}
