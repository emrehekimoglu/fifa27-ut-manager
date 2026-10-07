import { describe, expect, it } from 'vitest';

import { checkCatalogSize } from './catalog-validation.js';

describe('checkCatalogSize', () => {
  it('accepts a full first catalog', () => {
    expect(checkCatalogSize(19958, null)).toEqual({ ok: true });
  });

  it('accepts the minimum size exactly', () => {
    expect(checkCatalogSize(15000, null)).toEqual({ ok: true });
  });

  it('rejects a catalog below the minimum size', () => {
    expect(checkCatalogSize(14999, null)).toEqual({
      ok: false,
      reason: 'catalog has 14999 cards, fewer than the minimum of 15000',
    });
  });

  it('accepts growth and a shrink of exactly 5 %', () => {
    expect(checkCatalogSize(21000, 20000)).toEqual({ ok: true });
    expect(checkCatalogSize(19000, 20000)).toEqual({ ok: true });
  });

  it('rejects a shrink of more than 5 % against the last successful sync', () => {
    expect(checkCatalogSize(18999, 20000)).toEqual({
      ok: false,
      reason: 'catalog has 18999 cards, more than 5 % fewer than the previous 20000',
    });
  });
});
