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

const COMMIT_SHA_PATTERN = /^[0-9a-f]{7,40}$/i;
const SHORT_SHA_LENGTH = 7;

const ENVIRONMENT_LABELS: Record<DeploymentEnvironment, string> = {
  production: 'Canlı',
  preview: 'Önizleme',
  development: 'Yerel',
};

function isDeploymentEnvironment(value: string): value is DeploymentEnvironment {
  return Object.hasOwn(ENVIRONMENT_LABELS, value);
}

export function parseBuildInfo(raw: RawBuildInfo): BuildInfo {
  const commit = COMMIT_SHA_PATTERN.test(raw.commitSha)
    ? raw.commitSha.slice(0, SHORT_SHA_LENGTH).toLowerCase()
    : null;
  const environment = isDeploymentEnvironment(raw.environment) ? raw.environment : 'development';
  return { version: raw.version, commit, environment };
}

export function formatBuildInfo(info: BuildInfo): string {
  const commit = info.commit ?? 'yerel derleme';
  return `v${info.version} · ${commit} · ${ENVIRONMENT_LABELS[info.environment]}`;
}
