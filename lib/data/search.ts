import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { categories, postCategories, posts } from "@/db/schema";
import type { PostSummary } from "@/features/posts/types/post";
import type { CoverImage } from "@/db/schema/posts";

const SEARCH_COLUMNS = {
  slug: true,
  title: true,
  excerpt: true,
  type: true,
  published_at: true,
  reading_time_minutes: true,
  cover_image: true,
  status: true,
} as const;

const WITH_CATEGORIES = {
  postCategories: {
    with: { category: true },
  },
} as const;

type RawSearchRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  type: "travel" | "reading" | "essay";
  published_at: Date | null;
  reading_time_minutes: number | null;
  cover_image: CoverImage | null | undefined;
  status: string;
  postCategories: Array<{ category: { name: string; slug: string } }>;
};

function shapeResult(row: RawSearchRow): PostSummary {
  const primaryCat = row.postCategories[0]?.category;
  const cover = row.cover_image ?? null;
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: primaryCat?.name ?? "Uncategorized",
    categorySlug: primaryCat?.slug ?? "uncategorized",
    type: row.type,
    publishedAt: row.published_at?.toISOString() ?? new Date().toISOString(),
    readingTimeMinutes: row.reading_time_minutes,
    coverImage: cover
      ? {
          url: cover.url,
          alt: cover.alt,
          width: cover.width,
          height: cover.height,
          focalX: cover.focalX ?? 0.5,
          focalY: cover.focalY ?? 0.5,
        }
      : null,
  };
}

/**
 * Full-text search over published posts.
 *
 * Matches against:
 *   • title        — primary match
 *   • excerpt      — secondary match
 *   • category name — via correlated EXISTS subquery
 *
 * Uses PostgreSQL ILIKE (case-insensitive LIKE) rather than tsvector/tsquery.
 * Rationale: Thai text has no word-boundary delimiters, so standard Postgres
 * full-text search (which tokenises on spaces) produces poor recall for Thai
 * queries. ILIKE substring matching works correctly for both Thai and English.
 *
 * content_html is intentionally excluded — it contains raw HTML tags that
 * would produce noisy false-positive matches (e.g. searching "div").
 *
 * Returns at most 30 results, sorted newest-first.
 * Returns [] for empty / whitespace-only queries.
 */
export async function searchPosts(rawQuery: string): Promise<PostSummary[]> {
  const q = rawQuery.trim();
  if (!q) return [];

  const likePattern = `%${q}%`;

  const rows = await db.query.posts.findMany({
    where: and(
      eq(posts.status, "published"),
      or(
        ilike(posts.title, likePattern),
        ilike(posts.excerpt, likePattern),
        // Correlated subquery: post has at least one category whose name matches
        sql`EXISTS (
          SELECT 1
          FROM ${postCategories} _pc
          JOIN ${categories} _c ON _c.id = _pc.category_id
          WHERE _pc.post_id = ${posts.id}
          AND _c.name ILIKE ${likePattern}
        )`,
      ),
    ),
    orderBy: [desc(posts.published_at)],
    limit: 30,
    columns: SEARCH_COLUMNS,
    with: WITH_CATEGORIES,
  });

  return rows.map((r) => shapeResult(r as unknown as RawSearchRow));
}
