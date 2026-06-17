import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Content categories.
 *
 * Categories drive:
 * - URL routing  (/travel/..., /reading/..., /essays/...)
 * - Homepage section grouping
 * - Navigation links
 * - Admin filter panels
 *
 * They are managed dynamically from the admin panel — no categories are
 * hard-coded in application logic.
 */
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
