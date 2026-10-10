import { describe, expect, it } from 'vitest';

import { parseSample } from './sample-file.js';

describe('parseSample', () => {
  it('reads what the sampling step wrote', () => {
    const sample = {
      takenAt: '2026-10-09T08:00:00.000Z',
      cards: [{ eaId: 1 }],
      metarank: { 1: [{ role: 63, chemistryStyle: 1, score: 80 }], 2: null },
    };
    expect(parseSample(sample)).toEqual(sample);
  });

  it('refuses another file', () => {
    expect(() => parseSample({ takenAt: '2026-10-09', cards: [1], metarank: {} })).toThrow();
    expect(() => parseSample({ cards: [], metarank: {} })).toThrow();
  });
});
