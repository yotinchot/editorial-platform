import type { Metadata } from "next";
import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { categories, postCategories, posts } from "@/db/schema";
import { CategoriesManager } from "./categories-manager";

export const metadata: Metadata = {
  title: "Categories — Field Notes Admin",
  robots: { index: false, follow: false },
};

export default async function CategoriesPage() {
  // Fetch categories with published post counts
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      display_order: categories.display_order,
      created_at: categories.created_at,
      updated_at: categories.updated_at,
      postCount: sql<number>`CAST(COUNT(DISTINCT CASE WHEN ${posts.status} = 'published' THEN ${postCategories.post_id} END) AS INTEGER)`,
    })
    .from(categories)
    .leftJoin(postCategories, eq(postCategories.category_id, categories.id))
    .leftJoin(posts, eq(posts.id, postCategories.post_id))
    .groupBy(categories.id)
    .orderBy(asc(categories.display_order), asc(categories.name));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-foreground">Categories</h2>
        <p className="mt-0.5 text-sm text-foreground/50">
          {rows.length === 0
            ? "No categories yet"
            : `${rows.length} ${rows.length === 1 ? "category" : "categories"}`}
        </p>
      </div>

      <CategoriesManager initialCategories={rows} />
    </div>
  );
}
