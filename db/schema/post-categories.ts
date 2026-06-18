import { primaryKey, pgTable, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { posts } from "./posts";
import { categories } from "./categories";
import { postTags } from "./post-tags";

/**
 * Many-to-many join table: posts ↔ categories.
 *
 * A single post may belong to multiple categories (e.g. a travel essay
 * can be tagged as both "Travel" and "Essays").
 *
 * Composite primary key on (post_id, category_id) enforces uniqueness and
 * replaces the need for a surrogate id column.
 */
export const postCategories = pgTable(
  "post_categories",
  {
    post_id: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    category_id: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.post_id, table.category_id] })],
);

// ── Drizzle relations (used by relational query builder) ──────────────────

export const postsRelations = relations(posts, ({ many }) => ({
  postCategories: many(postCategories),
  postTags: many(postTags),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  postCategories: many(postCategories),
}));

export const postCategoriesRelations = relations(postCategories, ({ one }) => ({
  post: one(posts, {
    fields: [postCategories.post_id],
    references: [posts.id],
  }),
  category: one(categories, {
    fields: [postCategories.category_id],
    references: [categories.id],
  }),
}));

export type PostCategory = typeof postCategories.$inferSelect;
export type NewPostCategory = typeof postCategories.$inferInsert;
