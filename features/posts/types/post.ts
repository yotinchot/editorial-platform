export type PostType = "travel" | "reading" | "essay";

export interface CoverImageSummary {
  url: string;
  alt: string;
  width: number;
  height: number;
  focalX: number;
  focalY: number;
}

/**
 * Shape of a post as consumed by display components.
 * Mirrors the DB row shape so swapping placeholder → real data requires
 * no component changes — only the data source changes.
 */
export interface PostSummary {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  categorySlug: string;
  type: PostType;
  publishedAt: string; // ISO date string
  readingTimeMinutes: number | null;
  coverImage?: CoverImageSummary | null;
}

export interface PostDetail extends PostSummary {
  contentHtml: string | null;
  updatedAt: string; // ISO date string — used for OG modifiedTime and JSON-LD dateModified
}
