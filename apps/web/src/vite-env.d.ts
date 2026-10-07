/// <reference types="vite/client" />

import type { RawBuildInfo } from './lib/build-info';

declare global {
  /** Injected by Vite at build time; see vite.config.ts. */
  const __BUILD_INFO__: RawBuildInfo;
}
