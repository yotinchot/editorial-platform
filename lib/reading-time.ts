/**
 * Calculates estimated reading time from rendered HTML.
 *
 * Thai text has no word-boundary delimiters, so space-splitting alone would
 * massively undercount Thai words (an entire Thai paragraph may contain only
 * 2–3 spaces). Strategy:
 *   1. Count Thai characters (U+0E00–U+0E7F) and convert to word equivalents
 *      at ~5 chars/word (Thai average syllable cluster length).
 *   2. Strip Thai characters, then count remaining tokens by whitespace to
 *      get English/numeric word count — avoids double-counting mixed tokens.
 *   3. Sum both and divide by 180 WPM (conservative for mixed-language readers).
 */
export function calculateReadingTime(contentHtml: string | null): number {
  if (!contentHtml) return 1;

  const text = contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  // Thai characters — no word boundaries, ~5 chars ≈ 1 word.
  const thaiChars = (text.match(/[฀-๿]/g) ?? []).length;
  const thaiWords = thaiChars / 5;

  // Non-Thai tokens: remove Thai chars then split on whitespace.
  const nonThaiWords = text
    .replace(/[฀-๿]/g, "")
    .split(/\s+/)
    .filter(Boolean).length;

  const total = thaiWords + nonThaiWords;
  return Math.max(1, Math.ceil(total / 180));
}
