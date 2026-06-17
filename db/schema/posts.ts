import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Post lifecycle statuses.
 * - draft     : visible only in admin; never served to readers
 * - published : live and publicly accessible
 * - scheduled : will be published automatically at `scheduled_at`
 */
export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "published",
  "scheduled",
]);

/**
 * Post content types — drives layout selection and category routing.
 * - travel  : immersive visual storytelling with image gallery nodes
 * - reading : structured book reflection with Reading Block node
 * - essay   : standard long-form TipTap content
 */
export const postTypeEnum = pgEnum("post_type", [
  "travel",
  "reading",
  "essay",
]);

export const posts = pgTable("posts", {
  // ── Identity ──────────────────────────────────────────────────────────
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  type: postTypeEnum("type").notNull().default("essay"),

  // ── Content ───────────────────────────────────────────────────────────
  // Both representations are stored:
  // · content_json  — TipTap's ProseMirror JSON, used by the editor for
  //                   lossless round-trips and autosave.
  // · content_html  — Server-rendered HTML, used for public reading pages
  //                   and search indexing. Avoids running TipTap on every
  //                   page request.
  content_json: jsonb("content_json"),
  content_html: text("content_html"),

  // ── Media ─────────────────────────────────────────────────────────────
  cover_image_url: text("cover_image_url"),

  // ── Lifecycle ─────────────────────────────────────────────────────────
  status: postStatusEnum("status").notNull().default("draft"),
  featured: boolean("featured").notNull().default(false),
  reading_time_minutes: integer("reading_time_minutes"),
  published_at: timestamp("published_at", { withTimezone: true }),
  scheduled_at: timestamp("scheduled_at", { withTimezone: true }),

  // ── SEO overrides ─────────────────────────────────────────────────────
  // When null, SEO layers fall back to title / excerpt / cover_image_url.
  // These fields exist now so Phase 8 (SEO) needs no migration.
  seo_title: text("seo_title"),
  seo_description: text("seo_description"),
  og_image_url: text("og_image_url"),

  // ── Timestamps ────────────────────────────────────────────────────────
  // updated_at is maintained by the application (Server Actions set it on
  // every write). A Postgres trigger would also work but adds migration
  // complexity — keeping it explicit at the application layer for now.
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
