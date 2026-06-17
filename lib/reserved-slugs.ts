/**
 * Category slugs that must never be created in the database.
 *
 * These slugs collide with Next.js static routes at the root level.
 * App Router resolves static paths before dynamic [categorySlug] segments,
 * so a category with slug "about" would be permanently unreachable via the
 * public category page — its posts would have no accessible listing URL.
 *
 * Update this list whenever a new root-level static route is added.
 */
export const RESERVED_CATEGORY_SLUGS = new Set([
  "admin",
  "about",
  "search",
  "api",
  "sitemap",
  "robots",
]);

/**
 * Returns true when `slug` conflicts with a built-in application route.
 * Case-insensitive — slugs are always lowercased before storage, but this
 * guard defends against future callers that pass un-normalised input.
 */
export function isReservedCategorySlug(slug: string): boolean {
  return RESERVED_CATEGORY_SLUGS.has(slug.toLowerCase());
}
