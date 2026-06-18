import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { categories, postCategories, postTags, posts, tags } from "@/db/schema";
import type { PostSummary, TagSummary } from "@/features/posts/types/post";
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

const WITH_CATEGORIES_AND_TAGS = {
  postCategories: {
    with: { category: true },
  },
  postTags: {
    with: { tag: true },
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
  postTags: Array<{ tag: { name: string; slug: string } }>;
};

function shapeResult(row: RawSearchRow): PostSummary {
  const primaryCat = row.postCategories[0]?.category;
  const cover = row.cover_image ?? null;
  const rowTags: TagSummary[] = (row.postTags ?? []).map((pt) => ({
    name: pt.tag.name,
    slug: pt.tag.slug,
  }));
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: primaryCat?.name ?? "Uncategorized",
    categorySlug: primaryCat?.slug ?? "uncategorized",
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
    tags: rowTags,
  };
}

/**
 * Full-text search over published posts.
 *
 * Matches against title, excerpt, category name, and tag name.
 * Uses ILIKE for Thai/English compatibility.
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
        sql`EXISTS (
          SELECT 1
          FROM ${postCategories} _pc
          JOIN ${categories} _c ON _c.id = _pc.category_id
          WHERE _pc.post_id = ${posts.id}
          AND _c.name ILIKE ${likePattern}
        )`,
        sql`EXISTS (
          SELECT 1
          FROM ${postTags} _pt
          JOIN ${tags} _t ON _t.id = _pt.tag_id
          WHERE _pt.post_id = ${posts.id}
          AND _t.name ILIKE ${likePattern}
        )`,
      ),
    ),
    orderBy: [desc(posts.published_at)],
    limit: 30,
    columns: SEARCH_COLUMNS,
    with: WITH_CATEGORIES_AND_TAGS,
  });

  return rows.map((r) => shapeResult(r as unknown as RawSearchRow));
}
