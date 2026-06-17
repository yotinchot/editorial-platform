/**
 * Server-only slug utilities.
 *
 * This file imports the DB client (postgres) so it must NEVER be imported
 * from a client component. Use lib/slug-utils.ts for pure slug functions
 * that are safe in both client and server contexts.
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { titleToSlug } from "./slug-utils";

export { titleToSlug };

/**
 * Ensure `baseSlug` is unique in the `posts` table.
 *
 * If the slug is already taken by a *different* post, appends `-2`, `-3`, …
 * until a free slot is found.
 *
 * @param baseSlug  Already URL-safe slug candidate.
 * @param excludeId When editing an existing post, pass its ID so the current
 *                  post does not conflict with its own slug.
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  // Guarantee the base slug is non-empty.
  const base = baseSlug.length >= 3 ? baseSlug : `post-${Date.now()}`;
  let slug = base;
  let counter = 2;

  while (true) {
    const rows = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    const conflict = rows.find((r) => r.id !== excludeId);
    if (!conflict) return slug;

    slug = `${base}-${counter++}`;
  }
}
