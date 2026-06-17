/**
 * Pure slug utilities — no imports, safe to use in both client and server code.
 *
 * DB-dependent logic (ensureUniqueSlug) lives in lib/slug.ts (server-only).
 */

/**
 * Convert a plain-text title to a URL-safe slug.
 *
 * Returns an empty string when the result is too short (e.g. Thai-only
 * titles). Callers that need a guaranteed non-empty slug should fall back to
 * `post-${Date.now()}` or call `ensureUniqueSlug` which does that itself.
 */
export function titleToSlug(title: string): string {
  const ascii = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .replace(/[^\w\s-]/g, " ") // non-ASCII / non-word chars → space
    .trim()
    .replace(/\s+/g, "-") // whitespace runs → single hyphen
    .replace(/-+/g, "-") // duplicate hyphens → single
    .replace(/^-|-$/g, ""); // trim leading / trailing hyphens

  return ascii;
}
