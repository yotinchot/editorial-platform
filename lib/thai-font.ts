/** Unicode range for Thai script (U+0E00–U+0E7F). */
const THAI_RE = /[฀-๿]/;

/**
 * Returns true if the string contains at least one Thai character.
 *
 * Used to select the correct heading font family:
 *   - Thai (or mixed) headings → Noto Serif Thai only, so numerals and
 *     punctuation share the same metrics as the Thai glyphs.
 *   - Pure Latin headings → Cormorant Garamond (editorial serif).
 */
export function containsThai(text: string): boolean {
  return THAI_RE.test(text);
}
