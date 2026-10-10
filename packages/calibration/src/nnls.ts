import { at, dot } from './vector.js';

/** Columns whose solution value is at or below this count as zero. */
const TOLERANCE = 1e-10;

/** Solves `matrix × x = vector` by Gaussian elimination with partial pivoting. */
export function solveLinear(
  matrix: readonly (readonly number[])[],
  vector: readonly number[],
): number[] {
  const rows = matrix.map((row, index) => [...row, at(vector, index)]);
  const size = rows.length;
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(at(at(rows, row), column)) > Math.abs(at(at(rows, pivot), column))) pivot = row;
    }
    const pivotRow = at(rows, pivot);
    if (Math.abs(at(pivotRow, column)) < 1e-12) throw new Error('singular matrix');
    rows[pivot] = at(rows, column);
    rows[column] = pivotRow;
    for (const row of rows.slice(column + 1)) {
      const factor = at(row, column) / at(pivotRow, column);
      for (let k = column; k <= size; k += 1) row[k] = at(row, k) - factor * at(pivotRow, k);
    }
  }
  const solution = new Array<number>(size).fill(0);
  for (let index = size - 1; index >= 0; index -= 1) {
    const row = at(rows, index);
    solution[index] =
      (at(row, size) - dot(row.slice(index + 1, size), solution.slice(index + 1))) / at(row, index);
  }
  return solution;
}

/**
 * Minimises ‖Ax − b‖² subject to x ≥ 0, given the normal equations `gram` = AᵀA and
 * `moment` = Aᵀb (Lawson and Hanson's active-set method). Deterministic.
 */
export function nonNegativeLeastSquares(
  gram: readonly (readonly number[])[],
  moment: readonly number[],
): number[] {
  const size = moment.length;
  const passive = new Array<boolean>(size).fill(false);
  let x = new Array<number>(size).fill(0);
  const solvePassive = () => {
    const indices = passive.flatMap((isPassive, i) => (isPassive ? [i] : []));
    const sub = solveLinear(
      indices.map((i) => indices.map((j) => at(at(gram, i), j))),
      indices.map((i) => at(moment, i)),
    );
    const z = new Array<number>(size).fill(0);
    indices.forEach((i, k) => (z[i] = at(sub, k)));
    return z;
  };

  for (let iteration = 0; iteration < 3 * size; iteration += 1) {
    const gradient = moment.map((value, i) => value - dot(at(gram, i), x));
    let best = -1;
    let bestGradient = TOLERANCE;
    gradient.forEach((value, i) => {
      if (!at(passive, i) && value > bestGradient) {
        best = i;
        bestGradient = value;
      }
    });
    if (best < 0) break;
    passive[best] = true;
    for (;;) {
      const z = solvePassive();
      const blocking = passive.flatMap((isPassive, i) =>
        isPassive && at(z, i) <= TOLERANCE ? [i] : [],
      );
      if (blocking.length === 0) {
        x = z;
        break;
      }
      const step = Math.min(
        ...blocking.map((i) => {
          const drop = at(x, i) - at(z, i);
          return drop > 0 ? at(x, i) / drop : 0;
        }),
      );
      x = x.map((value, i) => value + step * (at(z, i) - value));
      x.forEach((value, i) => {
        if (value <= TOLERANCE) passive[i] = false;
      });
    }
  }
  return x;
}
