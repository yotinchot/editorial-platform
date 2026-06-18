import {
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

// ── TypeScript types for JSONB columns ─────────────────────────────────────

/**
 * Structured cover image metadata stored in the `cover_image` jsonb column.
 *
 * - `url`    : Cloudinary (or other CDN) delivery URL
 * - `alt`    : descriptive alt text for accessibility and SEO
 * - `width`  : intrinsic pixel width — used to set correct aspect-ratio and
 *              prevent Cumulative Layout Shift (CLS)
 * - `height` : intrinsic pixel height — same purpose
 * - `focalX` : horizontal focal point, normalised 0.0–1.0 (0 = left, 1 = right)
 * - `focalY` : vertical focal point, normalised 0.0–1.0 (0 = top, 1 = bottom)
 *
 * focalX / focalY drive CSS `object-position` and Cloudinary gravity transforms
 * so the subject stays in frame across aspect-ratio crops (16:9 hero → 1:1 card).
 */
export type CoverImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
  focalX: number;
  focalY: number;
  /** Cloudinary public_id — stored for future transformation use. */
  publicId?: string;
  /** CSS object-fit mode for the cover image hero display. */
  fitMode?: "cover" | "contain";
};

/**
 * Per-post type-specific metadata stored in the `metadata` jsonb column.
 *
 * Intentionally open-ended — validation happens at the application layer
 * via Zod schemas keyed on `post_type`. Examples:
 *   travel  → { destination, country, tripYear }
 *   reading → { bookAuthor, isbn, rating, pageCount }
 *
 * Using `Record<string, unknown>` rather than `unknown` signals that the
 * value is always a plain object if present, never a primitive or array.
 */
export type PostMetadata = Record<string, unknown>;

// ── Table definition ────────────────────────────────────────────────────────

export const posts = pgTable("posts", {
  // ── Identity ──────────────────────────────────────────────────────────
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  type: postTypeEnum("type").notNull().default("essay"),

  // ── Published content ─────────────────────────────────────────────────
  // Both representations are stored:
  // · content_json  — TipTap's ProseMirror JSON, the source of truth for
  //                   the editor. Updated only on explicit Save / Publish.
  // · content_html  — Server-rendered HTML for public reading pages and
  //                   search indexing. Avoids running TipTap server-side.
  content_json: jsonb("content_json"),
  content_html: text("content_html"),

  // ── Draft / autosave ──────────────────────────────────────────────────
  // TipTap writes to draft_content_json on every autosave tick.
  // content_json / content_html remain frozen until an explicit Save or
  // Publish action. This ensures autosave cannot overwrite live content.
  //
  // draft_saved_at is the source of truth for "last autosaved X ago"
  // indicators in the admin editor. It is NOT the same as updated_at,
  // which reflects any write (status changes, metadata edits, etc.).
  draft_content_json: jsonb("draft_content_json"),
  draft_saved_at: timestamp("draft_saved_at", { withTimezone: true }),

  // ── Cover image ───────────────────────────────────────────────────────
  // Structured jsonb replaces a bare URL string. Stores alt text,
  // intrinsic dimensions (for CLS prevention), and a normalised focal
  // point for responsive crops. See CoverImage type above.
  cover_image: jsonb("cover_image").$type<CoverImage>(),

  // ── Lifecycle ─────────────────────────────────────────────────────────
  status: postStatusEnum("status").notNull().default("draft"),

  // Nullable integer replaces the featured boolean.
  // NULL  = not featured.
  // 1,2,3 = editorial display order (ascending).
  // UNIQUE constraint prevents duplicate order positions.
  featured_order: integer("featured_order").unique(),

  reading_time_minutes: integer("reading_time_minutes"),
  published_at: timestamp("published_at", { withTimezone: true }),
  scheduled_at: timestamp("scheduled_at", { withTimezone: true }),

  // ── Per-type metadata ─────────────────────────────────────────────────
  // Escape hatch for type-specific structured data without per-type
  // column migrations. Validated by Zod at the application layer.
  // See PostMetadata type above.
  metadata: jsonb("metadata").$type<PostMetadata>(),

  // ── SEO overrides ─────────────────────────────────────────────────────
  // When null, SEO layers fall back to title / excerpt / cover_image.url.
  // These fields exist now so Phase 8 (SEO) needs no migration.
  seo_title: text("seo_title"),
  seo_description: text("seo_description"),
  og_image_url: text("og_image_url"),

  // ── Timestamps ────────────────────────────────────────────────────────
  // updated_at is maintained by the application (Server Actions set it on
  // every write). Do not use updated_at for autosave indicators — use
  // draft_saved_at instead.
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
