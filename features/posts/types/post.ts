export type PostType = "travel" | "reading" | "essay";

export interface CoverImageSummary {
  url: string;
  alt: string;
  width: number;
  height: number;
  focalX: number;
  focalY: number;
  fitMode?: "cover" | "contain";
}

export interface TagSummary {
  name: string;
  slug: string;
}

export interface PostSummary {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  categorySlug: string;
  /** @deprecated Type concept is being phased out — kept for backward compat. */
  type?: PostType;
  publishedAt: string;
  readingTimeMinutes: number | null;
  coverImage?: CoverImageSummary | null;
  tags: TagSummary[];
}

export interface PostDetail extends PostSummary {
  contentHtml: string | null;
  updatedAt: string;
}
