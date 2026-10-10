import { at } from './vector.js';

/** Mean absolute difference between paired values; 0 for no pairs. */
export function meanAbsoluteError(actual: readonly number[], expected: readonly number[]): number {
  if (actual.length === 0) return 0;
  return (
    actual.reduce((sum, value, i) => sum + Math.abs(value - at(expected, i)), 0) / actual.length
  );
}

/** 1-based ranks, ties sharing the mean of their ranks. */
export function ranks(values: readonly number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  return values.map((value) => {
    const first = sorted.indexOf(value);
    const last = sorted.lastIndexOf(value);
    return (first + last) / 2 + 1;
  });
}

function pearson(xs: readonly number[], ys: readonly number[]): number {
  const mean = (values: readonly number[]) => values.reduce((a, b) => a + b, 0) / values.length;
  const mx = mean(xs);
  const my = mean(ys);
  let covariance = 0;
  let vx = 0;
  let vy = 0;
  xs.forEach((x, i) => {
    const dy = at(ys, i) - my;
    covariance += (x - mx) * dy;
    vx += (x - mx) ** 2;
    vy += dy ** 2;
  });
  return vx === 0 || vy === 0 ? 0 : covariance / Math.sqrt(vx * vy);
}

/** Spearman's rank correlation: the Pearson correlation of the ranks. */
export function spearman(xs: readonly number[], ys: readonly number[]): number {
  return pearson(ranks(xs), ranks(ys));
}

/**
 * Whether the card is in the fixed 20 % hold-out (design §4): a multiplicative hash of the
 * EA id, so the split does not follow id order and never changes between runs.
 */
export function isHeldOut(eaId: number): boolean {
  return Math.imul(eaId, 2654435761) >>> 0 < 0x100000000 / 5;
}
