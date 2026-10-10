/** The element at `index`; an index outside the array is a programming error. */
export function at<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new RangeError(`index ${index} outside 0–${values.length - 1}`);
  return value;
}

export function dot(a: readonly number[], b: readonly number[]): number {
  return a.reduce((sum, value, index) => sum + value * at(b, index), 0);
}
