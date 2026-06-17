import { cache } from "react";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { categories } from "@/db/schema";
import type { CategorySummary } from "@/features/categories/types/category";

/** Returns all categories with a count of published posts, in display order. */
export async function getAllCategories(): Promise<CategorySummary[]> {
  const rows = await db.query.categories.findMany({
    orderBy: [asc(categories.display_order), asc(categories.name)],
    with: {
      postCategories: {
        with: {
          post: {
            columns: { status: true },
          },
        },
      },
    },
  });

  return rows.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    description: cat.description ?? "",
    postCount: cat.postCategories.filter((pc) => pc.post.status === "published")
      .length,
  }));
}

/**
 * Returns a single category by slug, or null if not found.
 *
 * Wrapped with React cache() so generateMetadata and the page component
 * share one DB round-trip per request.
 */
export const getCategoryBySlug = cache(
  async (slug: string): Promise<CategorySummary | null> => {
    const cat = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
      with: {
        postCategories: {
          with: {
            post: { columns: { status: true } },
          },
        },
      },
    });

    if (!cat) return null;

    return {
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      postCount: cat.postCategories.filter(
        (pc) => pc.post.status === "published",
      ).length,
    };
  },
);
