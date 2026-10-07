import { checkSourceHealth } from '@fc27/data-sync';
import type { FetchFn, HealthCheckDeps, SourceHealthReport } from '@fc27/data-sync';

export type { SourceHealthReport } from '@fc27/data-sync';

/** Number of sample cards returned per source. */
export const SOURCE_HEALTH_SAMPLE_SIZE = 3;

/** Lets Vercel's CDN serve a cached report for 5 minutes, refreshing in the background. */
export const SOURCE_HEALTH_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=600';

export interface SourceHealthDeps {
  readonly fetch: FetchFn;
  readonly now: () => number;
}

export async function handleSourceHealth(deps: SourceHealthDeps): Promise<Response> {
  const generatedAt = new Date(deps.now()).toISOString();
  const checkDeps: HealthCheckDeps = {
    fetch: deps.fetch,
    now: deps.now,
    sampleSize: SOURCE_HEALTH_SAMPLE_SIZE,
  };
  const sources = await Promise.all([
    checkSourceHealth('futgg', checkDeps),
    checkSourceHealth('ea', checkDeps),
  ]);
  const report: SourceHealthReport = { generatedAt, sources };
  return Response.json(report, { headers: { 'cache-control': SOURCE_HEALTH_CACHE_CONTROL } });
}
