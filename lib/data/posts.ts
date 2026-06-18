import { cache } from "react";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { categories, postCategories, posts } from "@/db/schema";
import type { CoverImage } from "@/db/schema/posts";
import type { PostDetail, PostSummary } from "@/features/posts/types/post";

// ── Column restrictions ──────────────────────────────────────────────────────
// Card queries exclude content_html / content_json / draft_* columns.
// This avoids pulling potentially large HTML blobs for pages that only
// render post cards (homepage, category listings).

const CARD_COLUMNS = {
  slug: true,
  title: true,
  excerpt: true,
  type: true,
  published_at: true,
  reading_time_minutes: true,
  cover_image: true,
  status: true, // needed for in-memory filter in getPostsByCategory
} as const;

// Detail query additionally needs the rendered HTML and last-modified timestamp.
const DETAIL_COLUMNS = {
  ...CARD_COLUMNS,
  content_html: true,
  updated_at: true,
} as const;

// ── Internal helpers ─────────────────────────────────────────────────────────

type RawRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  type: "travel" | "reading" | "essay";
  published_at: Date | null;
  reading_time_minutes: number | null;
  cover_image: CoverImage | null | undefined;
  status: string;
  postCategories: Array<{
    category: { name: string; slug: string };
  }>;
};

type RawDetailRow = RawRow & {
  content_html: string | null;
  updated_at: Date | null;
};

function shapeForCard(row: RawRow): PostSummary {
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
          fitMode: cover.fitMode,
        }
      : null,
  };
}

const WITH_CATEGORIES = {
  postCategories: {
    with: { category: true },
  },
} as const;

// ── Public queries ───────────────────────────────────────────────────────────

/** Returns the featured post (lowest featured_order). Null if none exist. */
export async function getFeaturedPost(): Promise<PostSummary | null> {
  const row = await db.query.posts.findFirst({
    where: and(eq(posts.status, "published"), isNotNull(posts.featured_order)),
    orderBy: [asc(posts.featured_order)],
    columns: CARD_COLUMNS,
    with: WITH_CATEGORIES,
  });
  return row ? shapeForCard(row as unknown as RawRow) : null;
}

/** Returns most-recent published posts, newest first. */
export async function getLatestPosts(limit = 6): Promise<PostSummary[]> {
  const rows = await db.query.posts.findMany({
    where: eq(posts.status, "published"),
    orderBy: [desc(posts.published_at)],
    limit,
    columns: CARD_COLUMNS,
    with: WITH_CATEGORIES,
  });
  return rows.map((r) => shapeForCard(r as unknown as RawRow));
}

/** Returns published posts filtered by type, newest first. */
export async function getPostsByType(
  type: "travel" | "reading" | "essay",
  limit = 6,
): Promise<PostSummary[]> {
  const rows = await db.query.posts.findMany({
    where: and(eq(posts.status, "published"), eq(posts.type, type)),
    orderBy: [desc(posts.published_at)],
    limit,
    columns: CARD_COLUMNS,
    with: WITH_CATEGORIES,
  });
  return rows.map((r) => shapeForCard(r as unknown as RawRow));
}

/** Returns published posts belonging to a category slug, newest first. */
export async function getPostsByCategory(
  categorySlug: string,
  limit = 30,
): Promise<PostSummary[]> {
  const cat = await db.query.categories.findFirst({
    where: eq(categories.slug, categorySlug),
    columns: { id: true },
  });
  if (!cat) return [];

  const joins = await db.query.postCategories.findMany({
    where: eq(postCategories.category_id, cat.id),
    with: {
      post: {
        columns: CARD_COLUMNS,
        with: WITH_CATEGORIES,
      },
    },
  });

  return joins
    .filter((j) => j.post.status === "published" && j.post.published_at != null)
    .sort(
      (a, b) =>
        (b.post.published_at?.getTime() ?? 0) -
        (a.post.published_at?.getTime() ?? 0),
    )
    .slice(0, limit)
    .map((j) => shapeForCard(j.post as unknown as RawRow));
}

/**
 * Returns minimal post data for sitemap generation.
 * Fetches only slug, updated_at, published_at, and primary category.
 */
export async function getPublishedPostsForSitemap(): Promise<
  Array<{ slug: string; categorySlug: string; updatedAt: Date }>
> {
  const rows = await db.query.posts.findMany({
    where: eq(posts.status, "published"),
    columns: { slug: true, updated_at: true, published_at: true },
    with: WITH_CATEGORIES,
    orderBy: [desc(posts.published_at)],
  });

  return rows.map((r) => {
    const categorySlug =
      (r as unknown as { postCategories: Array<{ category: { slug: string } }> })
        .postCategories[0]?.category?.slug ?? "uncategorized";
    return {
      slug: r.slug,
      categorySlug,
      updatedAt: (r as unknown as { updated_at: Date }).updated_at ?? new Date(),
    };
  });
}

/**
 * Finds a published post by slug, verifying it belongs to the given category.
 * Returns null (→ notFound()) if the post doesn't exist, isn't published,
 * or doesn't belong to the specified category.
 *
 * Wrapped with React cache() so generateMetadata and the page component
 * share one DB round-trip per request.
 */
export const getPostDetail = cache(
  async (categorySlug: string, postSlug: string): Promise<PostDetail | null> => {
    const row = await db.query.posts.findFirst({
      where: and(eq(posts.status, "published"), eq(posts.slug, postSlug)),
      columns: DETAIL_COLUMNS,
      with: WITH_CATEGORIES,
    });

    if (!row) return null;

    const belongsToCategory = (row as unknown as RawRow).postCategories.some(
      (pc) => pc.category.slug === categorySlug,
    );
    if (!belongsToCategory) return null;

    const detail = row as unknown as RawDetailRow;
    const base = shapeForCard(row as unknown as RawRow);
    return {
      ...base,
      contentHtml: detail.content_html ?? null,
      updatedAt: (detail.updated_at ?? new Date()).toISOString(),
    };
  },
);
