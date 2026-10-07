export type DeploymentEnvironment = 'production' | 'preview' | 'development';

/** Build metadata as injected at build time (see vite.config.ts). */
export interface RawBuildInfo {
  readonly version: string;
  readonly commitSha: string;
  readonly environment: string;
}

export interface BuildInfo {
  readonly version: string;
  /** Short (7-character) commit SHA, or null when the build has no valid commit. */
  readonly commit: string | null;
  readonly environment: DeploymentEnvironment;
}

export function parseBuildInfo(_raw: RawBuildInfo): BuildInfo {
  throw new Error('Not implemented');
}

export function formatBuildInfo(_info: BuildInfo): string {
  throw new Error('Not implemented');
}
