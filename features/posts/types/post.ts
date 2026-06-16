/**
 * Shape of a post as consumed by display components. This intentionally
 * mirrors (a subset of) the future Drizzle `posts` table shape so swapping
 * placeholder data for real queries in a later phase is a non-event for
 * the components below.
 */
export type PostType = "travel" | "reading" | "essay";

export interface PostSummary {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug: string;
  type: PostType;
  publishedAt: string; // ISO date
  readingTimeMinutes: number;
}
