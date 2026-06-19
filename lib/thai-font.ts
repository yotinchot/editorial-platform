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

/**
 * In an HTML string, wraps bare digit sequences with <span class="thai-heading-number">.
 * Digits inside HTML tag attributes are skipped — only text-node digits are wrapped.
 * Call only on headings that containsThai() — pure Latin headings are unchanged.
 *
 * Digit pattern covers: 10  30  2026  1,000  10.5  90%
 */
export function wrapDigitsInHTML(html: string): string {
  // Alternation: consume HTML tags first (no capture), or capture digit sequences.
  return html.replace(/<[^>]+>|(\d+(?:[,.]\d+)*%?)/g, (match, digits) => {
    if (digits !== undefined) {
      return `<span class="thai-heading-number">${digits}</span>`;
    }
    return match;
  });
}
