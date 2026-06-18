import type { PostSummary } from "@/features/posts/types/post";
import type { CategorySummary } from "@/features/categories/types/category";

/**
 * TEMPORARY placeholder content for Phase 1 layout work.
 * Remove once `actions/posts.ts` / `actions/categories.ts` query the real
 * Postgres tables (Phase 2 — Database & Content Model).
 */
export const PLACEHOLDER_POSTS: PostSummary[] = [
  {
    slug: "kyoto-autumn-guide",
    title: "Kyoto in Autumn: A Slow Itinerary",
    excerpt:
      "Eleven days moving at the pace of falling leaves — temple gardens, backstreet coffee, and the discipline of doing less.",
    category: "Travel",
    categorySlug: "travel",
    type: "travel",
    publishedAt: "2026-05-12",
    readingTimeMinutes: 9,
    tags: [],
  },
  {
    slug: "atomic-habits-notes",
    title: "Atomic Habits — Reading Notes",
    excerpt:
      "The single idea worth keeping from James Clear's book, and the three I quietly disagree with.",
    category: "Reading",
    categorySlug: "reading",
    type: "reading",
    publishedAt: "2026-04-28",
    readingTimeMinutes: 6,
    tags: [],
  },
  {
    slug: "building-consistency",
    title: "On Building Consistency",
    excerpt: "What a year of showing up — badly, then less badly — actually taught me.",
    category: "Life",
    categorySlug: "life",
    type: "essay",
    publishedAt: "2026-04-10",
    readingTimeMinutes: 7,
    tags: [],
  },
  {
    slug: "lisbon-in-march",
    title: "Lisbon in March, Off-Season",
    excerpt: "Empty miradouros, the last cold mornings, and why off-season travel rewards patience.",
    category: "Travel",
    categorySlug: "travel",
    type: "travel",
    publishedAt: "2026-03-22",
    readingTimeMinutes: 8,
    tags: [],
  },
  {
    slug: "four-thousand-weeks-notes",
    title: "Four Thousand Weeks — Reading Notes",
    excerpt: "Oliver Burkeman's case against productivity culture, distilled into the parts that stuck.",
    category: "Reading",
    categorySlug: "reading",
    type: "reading",
    publishedAt: "2026-03-02",
    readingTimeMinutes: 5,
    tags: [],
  },
  {
    slug: "the-discipline-of-fewer-projects",
    title: "The Discipline of Fewer Projects",
    excerpt: "A short essay on saying no to good ideas so the great ones have room to breathe.",
    category: "Life",
    categorySlug: "life",
    type: "essay",
    publishedAt: "2026-02-18",
    readingTimeMinutes: 4,
    tags: [],
  },
];

export const FEATURED_POST = PLACEHOLDER_POSTS[0];

export const PLACEHOLDER_CATEGORIES: CategorySummary[] = [
  { name: "Travel", slug: "travel", description: "Itineraries, places, and the art of slow movement.", postCount: 14 },
  { name: "Reading", slug: "reading", description: "Notes from books worth sitting with.", postCount: 22 },
  { name: "Life", slug: "life", description: "Essays on habits, attention, and craft.", postCount: 9 },
  { name: "Football", slug: "football", description: "Tactics, transfers, and the matches that mattered.", postCount: 5 },
];
