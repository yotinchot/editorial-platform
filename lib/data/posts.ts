import { cache } from "react";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { categories, postCategories, posts, postTags, tags } from "@/db/schema";
import type { CoverImage } from "@/db/schema/posts";
import type { PostDetail, PostSummary, TagSummary } from "@/features/posts/types/post";

// ── Column restrictions ──────────────────────────────────────────────────────

const CARD_COLUMNS = {
  slug: true,
  title: true,
  excerpt: true,
  type: true,
  published_at: true,
  reading_time_minutes: true,
  cover_image: true,
  status: true,
} as const;

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
  postTags: Array<{
    tag: { name: string; slug: string };
  }>;
};

type RawDetailRow = RawRow & {
  content_html: string | null;
  updated_at: Date | null;
};

function shapeForCard(row: RawRow): PostSummary {
  const primaryCat = row.postCategories[0]?.category;
  const cover = row.cover_image ?? null;
  const tags: TagSummary[] = (row.postTags ?? []).map((pt) => ({
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
          fitMode: cover.fitMode,
        }
      : null,
    tags,
  };
}

const WITH_CATEGORIES_AND_TAGS = {
  postCategories: {
    with: { category: true },
  },
  postTags: {
    with: { tag: true },
  },
} as const;

// ── Public queries ───────────────────────────────────────────────────────────

export async function getFeaturedPost(): Promise<PostSummary | null> {
  const row = await db.query.posts.findFirst({
    where: and(eq(posts.status, "published"), isNotNull(posts.featured_order)),
    orderBy: [asc(posts.featured_order)],
    columns: CARD_COLUMNS,
    with: WITH_CATEGORIES_AND_TAGS,
  });
  return row ? shapeForCard(row as unknown as RawRow) : null;
}

export async function getLatestPosts(limit = 6): Promise<PostSummary[]> {
  const rows = await db.query.posts.findMany({
    where: eq(posts.status, "published"),
    orderBy: [desc(posts.published_at)],
    limit,
    columns: CARD_COLUMNS,
    with: WITH_CATEGORIES_AND_TAGS,
  });
  return rows.map((r) => shapeForCard(r as unknown as RawRow));
}

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
        with: WITH_CATEGORIES_AND_TAGS,
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

export async function getPostsByTag(
  tagSlug: string,
  limit = 30,
): Promise<PostSummary[]> {
  const tag = await db.query.tags.findFirst({
    where: eq(tags.slug, tagSlug),
    columns: { id: true },
  });
  if (!tag) return [];

  const joins = await db.query.postTags.findMany({
    where: eq(postTags.tag_id, tag.id),
    with: {
      post: {
        columns: CARD_COLUMNS,
        with: WITH_CATEGORIES_AND_TAGS,
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

export async function getPublishedPostsForSitemap(): Promise<
  Array<{ slug: string; categorySlug: string; updatedAt: Date }>
> {
  const rows = await db.query.posts.findMany({
    where: eq(posts.status, "published"),
    columns: { slug: true, updated_at: true, published_at: true },
    with: WITH_CATEGORIES_AND_TAGS,
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

export const getPostDetail = cache(
  async (categorySlug: string, postSlug: string): Promise<PostDetail | null> => {
    const row = await db.query.posts.findFirst({
      where: and(eq(posts.status, "published"), eq(posts.slug, postSlug)),
      columns: DETAIL_COLUMNS,
      with: WITH_CATEGORIES_AND_TAGS,
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
