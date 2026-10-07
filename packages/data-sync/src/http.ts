import type { CardSource } from './catalog-card.js';

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

/** Thrown when a source answers with a non-success status or a non-JSON body. */
export class SourceHttpError extends Error {
  constructor(
    readonly source: CardSource,
    readonly status: number | null,
    message: string,
  ) {
    super(`[${source}] ${message}`);
    this.name = 'SourceHttpError';
  }
}

export function getJson(
  _source: CardSource,
  _url: string,
  _fetchFn: FetchFn,
  _headers: Record<string, string> = {},
): Promise<unknown> {
  throw new Error('Not implemented');
}
