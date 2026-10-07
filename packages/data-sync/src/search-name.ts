/** Letters that Unicode normalisation does not split into a base letter and an accent. */
const FOLDED_LETTERS: Readonly<Record<string, string>> = {
  ı: 'i',
  ø: 'o',
  ł: 'l',
  đ: 'd',
  ß: 'ss',
};

/**
 * Normalises a name for accent- and case-insensitive search, so that
 * "mbappe" finds "Kylian Mbappé" and "calhanoglu" finds "Hakan Çalhanoğlu".
 */
export function toSearchName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[ıøłđß]/g, (letter) => FOLDED_LETTERS[letter] ?? letter)
    .replace(/\s+/g, ' ')
    .trim();
}
