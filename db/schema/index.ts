/**
 * Single import surface for all schema tables and enums.
 *
 * Drizzle Kit reads this file via drizzle.config.ts.
 * Application code should import from here, not from individual files,
 * so that moving a table definition never breaks multiple import sites.
 *
 * Usage:
 *   import { posts, categories, postCategories } from "@/db/schema";
 */

export * from "./posts";
export * from "./categories";
export * from "./post-categories";
export * from "./tags";
export * from "./post-tags";
export * from "./admin-sessions";
