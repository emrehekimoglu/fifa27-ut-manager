/// <reference types="vite/client" />

import type { RawBuildInfo } from './lib/build-info';

declare global {
  /** Injected by Vite at build time; see vite.config.ts. */
  const __BUILD_INFO__: RawBuildInfo;

  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  }
}
