import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
 *
 * display_order controls the sequence in navigation and homepage sections.
 * Rows are sorted ASC on display_order, then ASC on name as a tiebreaker.
 * Default 0 means all categories share the same priority until manually set.
 */
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),

  // Controls navigation and homepage section ordering.
  // Lower value = appears first. Default 0 = no preference set.
  // Sort: ORDER BY display_order ASC, name ASC
  display_order: integer("display_order").notNull().default(0),

  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
