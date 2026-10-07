import { describe, expect, it } from 'vitest';

import { formatBuildInfo, parseBuildInfo } from './build-info';

const FULL_SHA = '3f9c2a7d1e0b4c58a6d2e9f1b7c3a0d4e5f6a7b8';

describe('parseBuildInfo', () => {
  it('shortens a full commit SHA to its first 7 characters', () => {
    expect(
      parseBuildInfo({ version: '0.1.0', commitSha: FULL_SHA, environment: 'production' }),
    ).toEqual({ version: '0.1.0', commit: '3f9c2a7', environment: 'production' });
  });

  it('accepts an already-short SHA and normalises it to lower case', () => {
    expect(
      parseBuildInfo({ version: '0.1.0', commitSha: 'ABCDEF1', environment: 'preview' }).commit,
    ).toBe('abcdef1');
  });

  it('treats a missing commit SHA as no commit', () => {
    expect(
      parseBuildInfo({ version: '0.1.0', commitSha: '', environment: 'development' }).commit,
    ).toBeNull();
  });

  it('rejects values that are not a hexadecimal SHA of 7 to 40 characters', () => {
    for (const commitSha of ['main', 'abc123', `${FULL_SHA}0`, 'g'.repeat(40)]) {
      expect(
        parseBuildInfo({ version: '0.1.0', commitSha, environment: 'preview' }).commit,
      ).toBeNull();
    }
  });

  it.each([
    ['production', 'production'],
    ['preview', 'preview'],
    ['development', 'development'],
  ] as const)('keeps the known environment "%s"', (environment, expected) => {
    expect(parseBuildInfo({ version: '0.1.0', commitSha: '', environment }).environment).toBe(
      expected,
    );
  });

  it('falls back to development for an unknown environment', () => {
    expect(
      parseBuildInfo({ version: '0.1.0', commitSha: '', environment: 'staging' }).environment,
    ).toBe('development');
  });
});

describe('formatBuildInfo', () => {
  it('formats a production build as version, short commit and Turkish label', () => {
    expect(
      formatBuildInfo({ version: '0.1.0', commit: '3f9c2a7', environment: 'production' }),
    ).toBe('v0.1.0 · 3f9c2a7 · Canlı');
  });

  it('labels preview builds as "Önizleme"', () => {
    expect(formatBuildInfo({ version: '0.1.0', commit: '3f9c2a7', environment: 'preview' })).toBe(
      'v0.1.0 · 3f9c2a7 · Önizleme',
    );
  });

  it('labels development builds without a commit as a local build', () => {
    expect(formatBuildInfo({ version: '0.0.0', commit: null, environment: 'development' })).toBe(
      'v0.0.0 · yerel derleme · Yerel',
    );
  });
});
