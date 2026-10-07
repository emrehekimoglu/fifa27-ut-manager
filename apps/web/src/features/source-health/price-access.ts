/** Results of the M1 price-access spike on 2026-10-07 (see ADR-0004). */
export interface PriceAccessResult {
  readonly source: string;
  readonly fromServer: string;
  readonly fromHome: string;
  readonly decision: string;
}

export const PRICE_ACCESS_TESTED_ON = '7 Ekim 2026';

export const PRICE_ACCESS_RESULTS: readonly PriceAccessResult[] = [
  {
    source: 'FUT.GG',
    fromServer: 'Fiyat gösterilmiyor',
    fromHome: 'Fiyat alındı',
    decision: 'Fiyat kaynağı (M5)',
  },
  {
    source: 'FUTWIZ',
    fromServer: 'Engellendi',
    fromHome: 'Sadece görünür tarayıcıda',
    decision: 'Kullanılmayacak',
  },
  {
    source: 'FUTBIN',
    fromServer: 'Engellendi',
    fromHome: 'CAPTCHA istedi',
    decision: 'Kullanılmayacak',
  },
];
