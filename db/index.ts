/**
 * db/index.ts — public API for the database layer.
 *
 * Import from here in Server Components and Server Actions:
 *   import { db } from "@/db";
 *   import { posts, categories } from "@/db/schema";
 */

export { db } from "./client";
export * from "./schema";
