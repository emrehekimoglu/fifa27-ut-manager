import { describe, expect, it } from 'vitest';

import eaPage from '../../../packages/data-sync/test/fixtures/ea-ratings-page.json' with { type: 'json' };
import futggPage from '../../../packages/data-sync/test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import type { FetchFn } from '@fc27/data-sync';
import { handleSourceHealth } from './source-health';
import type { SourceHealthReport } from './source-health';

const NOW = Date.UTC(2026, 9, 7, 19, 0, 0);

/** Answers like the real sources, keyed by host. */
const fakeSources =
  (overrides: { futgg?: Response; ea?: Response } = {}): FetchFn =>
  (url) => {
    if (url.startsWith('https://www.fut.gg/')) {
      return Promise.resolve(overrides.futgg ?? Response.json(futggPage));
    }
    if (url.startsWith('https://drop-api.ea.com/')) {
      return Promise.resolve(overrides.ea ?? Response.json(eaPage));
    }
    return Promise.reject(new Error(`unexpected request to ${url}`));
  };

async function readReport(response: Response): Promise<SourceHealthReport> {
  return (await response.json()) as SourceHealthReport;
}

describe('handleSourceHealth', () => {
  it('returns a cacheable JSON report of the live EA check only', async () => {
    const requests: string[] = [];
    const fetch: FetchFn = (url, init) => {
      requests.push(url);
      return fakeSources()(url, init);
    };
    const response = await handleSourceHealth({ fetch, now: () => NOW });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('cache-control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=600',
    );

    const report = await readReport(response);
    expect(report.generatedAt).toBe('2026-10-07T19:00:00.000Z');
    expect(
      report.sources.map(({ source, status, totalCards, totalIsCapped, error }) => ({
        source,
        status,
        totalCards,
        totalIsCapped,
        error,
      })),
    ).toEqual([
      { source: 'ea', status: 'ok', totalCards: 19789, totalIsCapped: false, error: null },
    ]);
    expect(report.sources.map((source) => source.sample.map((card) => card.name))).toEqual([
      ['Kylian Mbappé', 'Thibaut Courtois', 'Erling Haaland'],
    ]);
    // FUT.GG rejects Vercel's servers, so its status comes from the stored catalog instead.
    expect(requests.some((url) => url.startsWith('https://www.fut.gg/'))).toBe(false);
  });

  it('still answers 200 when EA fails, reporting it as an error', async () => {
    const response = await handleSourceHealth({
      fetch: fakeSources({ ea: new Response('Bad Gateway', { status: 502 }) }),
      now: () => NOW,
    });

    expect(response.status).toBe(200);
    const report = await readReport(response);
    expect(report.sources.map(({ source, status, error }) => ({ source, status, error }))).toEqual([
      { source: 'ea', status: 'error', error: '[ea] HTTP 502' },
    ]);
  });
});
