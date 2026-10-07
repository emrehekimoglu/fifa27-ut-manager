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

export async function getJson(
  source: CardSource,
  url: string,
  fetchFn: FetchFn,
  headers: Record<string, string> = {},
): Promise<unknown> {
  const response = await fetchFn(url, { headers });
  if (!response.ok) {
    throw new SourceHttpError(source, response.status, `HTTP ${response.status}`);
  }
  try {
    const body: unknown = await response.json();
    return body;
  } catch {
    throw new SourceHttpError(source, response.status, 'invalid JSON body');
  }
}
