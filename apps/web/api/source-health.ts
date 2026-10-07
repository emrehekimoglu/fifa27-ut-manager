import { handleSourceHealth } from '../server/source-health.js';

/** Vercel serverless function: GET /api/source-health */
export function GET(): Promise<Response> {
  return handleSourceHealth({ fetch, now: Date.now });
}
