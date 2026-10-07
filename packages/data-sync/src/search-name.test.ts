import { describe, expect, it } from 'vitest';

import { toSearchName } from './search-name.js';

describe('toSearchName', () => {
  it('lower-cases and strips combining accents', () => {
    expect(toSearchName('Kylian Mbappé')).toBe('kylian mbappe');
    expect(toSearchName('Pelé')).toBe('pele');
  });

  it('folds Turkish letters, including the dotless and dotted i', () => {
    expect(toSearchName('Hakan Çalhanoğlu')).toBe('hakan calhanoglu');
    expect(toSearchName('Kerem Aktürkoğlu')).toBe('kerem akturkoglu');
    expect(toSearchName('Arda Güler')).toBe('arda guler');
    expect(toSearchName('Barış Alper Yılmaz')).toBe('baris alper yilmaz');
    expect(toSearchName('İsmail Yüksek')).toBe('ismail yuksek');
  });

  it('folds letters that have no combining-accent decomposition', () => {
    expect(toSearchName('Martin Ødegaard')).toBe('martin odegaard');
    expect(toSearchName('Łukasz Fabiański')).toBe('lukasz fabianski');
    expect(toSearchName('Đorđe Petrović')).toBe('dorde petrovic');
    expect(toSearchName('Kevin Großkreutz')).toBe('kevin grosskreutz');
  });

  it('trims and collapses whitespace', () => {
    expect(toSearchName('  Vinícius   Júnior ')).toBe('vinicius junior');
  });
});
