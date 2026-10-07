import { describe, expect, it } from 'vitest';

import {
  formatCardCount,
  formatCheckedAt,
  formatLatency,
  sourceName,
  sourceRole,
  statusLabel,
} from './format';

describe('source labels', () => {
  it('names each source and its role in Turkish', () => {
    expect(sourceName('futgg')).toBe('FUT.GG');
    expect(sourceRole('futgg')).toBe('Birincil kaynak');
    expect(sourceName('ea')).toBe('EA resmi API');
    expect(sourceRole('ea')).toBe('Yedek kaynak');
  });

  it('labels the check status in Turkish', () => {
    expect(statusLabel('ok')).toBe('Çalışıyor');
    expect(statusLabel('error')).toBe('Hata');
  });
});

describe('formatCardCount', () => {
  it('uses Turkish thousands separators', () => {
    expect(formatCardCount(19789, false)).toBe('19.789');
    expect(formatCardCount(950, false)).toBe('950');
  });

  it('marks a capped total as a lower bound', () => {
    expect(formatCardCount(10000, true)).toBe('10.000+');
  });
});

describe('formatLatency', () => {
  it('shows sub-second latencies in whole milliseconds', () => {
    expect(formatLatency(412)).toBe('412 ms');
    expect(formatLatency(999)).toBe('999 ms');
  });

  it('shows longer latencies in seconds with one Turkish decimal', () => {
    expect(formatLatency(1000)).toBe('1,0 sn');
    expect(formatLatency(3240)).toBe('3,2 sn');
  });
});

describe('formatCheckedAt', () => {
  it('shows the clock time in Türkiye (UTC+3)', () => {
    expect(formatCheckedAt('2026-10-07T19:00:00.000Z')).toBe('22:00');
    expect(formatCheckedAt('2026-10-07T21:05:00.000Z')).toBe('00:05');
  });
});
