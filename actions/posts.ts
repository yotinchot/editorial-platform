"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { posts, categories, postCategories } from "@/db/schema";
import { getSessionToken } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { generatePostHTML } from "@/lib/html";
import { calculateReadingTime } from "@/lib/reading-time";
import { ensureUniqueSlug, titleToSlug } from "@/lib/slug";

// ── Auth guard ──────────────────────────────────────────────────────────────

async function requireAuth(): Promise<void> {
  const token = await getSessionToken();
  if (!token || !(await verifySession(token))) {
    redirect("/admin/login");
  }
}

// ── Zod schemas ─────────────────────────────────────────────────────────────

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
});

const coverImageSchema = z
  .object({
    url: z.string().url(),
    alt: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    focalX: z.number().min(0).max(1),
    focalY: z.number().min(0).max(1),
    publicId: z.string().optional(),
  })
  .nullable();

const updatePostSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
      "Slug may only contain lowercase letters, numbers, and hyphens",
    ),
  excerpt: z.string().max(500).optional().default(""),
  type: z.enum(["travel", "reading", "essay"]),
  status: z.enum(["draft", "published"]),
  category_ids: z.array(z.string().uuid()),
  content_json: z.unknown().nullable(),
  cover_image: coverImageSchema,
});

const autosaveSchema = z.object({
  draft_content_json: z.unknown(),
});

// ── createPostDraft ──────────────────────────────────────────────────────────

/**
 * Create a new post as a draft with just a title.
 * Returns the created post row on success, or an error string.
 *
 * Called programmatically from NewPostForm (client component), which
 * then navigates to /admin/posts/[id]/edit.
 */
export async function createPostDraft(rawData: {
  title: string;
}): Promise<{ post: typeof posts.$inferSelect } | { error: string }> {
  await requireAuth();

  const parsed = createPostSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title } = parsed.data;
  const baseSlug = titleToSlug(title);
  const slug = await ensureUniqueSlug(baseSlug);

  const [post] = await db
    .insert(posts)
    .values({ title, slug, type: "essay", status: "draft" })
    .returning();

  return { post };
}

// ── autosavePostDraft ────────────────────────────────────────────────────────

/**
 * Autosave: write ONLY draft_content_json, draft_saved_at, and updated_at.
 *
 * Never touches content_json, content_html, or published_at — those are
 * written only on an explicit manual Save / Publish.
 */
export async function autosavePostDraft(
  postId: string,
  rawData: { draft_content_json: unknown },
): Promise<{ saved_at: string } | { error: string }> {
  await requireAuth();

  const parsed = autosaveSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Invalid autosave data" };
  }

  const now = new Date();

  await db
    .update(posts)
    .set({
      draft_content_json: parsed.data.draft_content_json,
      draft_saved_at: now,
      updated_at: now,
    })
    .where(eq(posts.id, postId));

  return { saved_at: now.toISOString() };
}

// ── updatePost ───────────────────────────────────────────────────────────────

/**
 * Manual save: write all editable fields including published content.
 *
 * - Generates content_html server-side from content_json (no DOM).
 * - Sets published_at only on the first transition to "published".
 * - Updates category relationships (delete-all, re-insert).
 * - Enforces slug uniqueness (appends -2, -3 … if needed).
 */
export async function updatePost(
  postId: string,
  rawData: unknown,
): Promise<{ post: typeof posts.$inferSelect } | { error: string }> {
  await requireAuth();

  const parsed = updatePostSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const {
    title,
    slug,
    excerpt,
    type,
    status,
    category_ids,
    content_json,
    cover_image,
  } = parsed.data;

  // L-3: Prevent publishing without at least one category.
  // Uncategorized published posts have no reachable URL (the public route
  // validates that the post belongs to the category in the URL segment).
  if (status === "published" && category_ids.length === 0) {
    return {
      error:
        "A post must belong to at least one category before it can be published.",
    };
  }

  // Ensure the slug is unique, excluding this post from the uniqueness check.
  const uniqueSlug = await ensureUniqueSlug(slug, postId);

  // Generate HTML from TipTap JSON (server-side, no DOM).
  // Returns null on failure — abort the save rather than storing empty HTML.
  const content_html = content_json ? generatePostHTML(content_json) : null;

  if (content_json && content_html === null) {
    return {
      error:
        "Failed to generate post HTML from editor content. Please try saving again.",
    };
  }

  // Calculate reading time from rendered HTML so the public page always shows
  // an accurate estimate without a separate fetch. Falls back to null if no
  // HTML is available (e.g. post is saved before any content is written).
  const reading_time_minutes = content_html
    ? calculateReadingTime(content_html)
    : null;

  const now = new Date();

  // Wrap post update + category rebuild in a single transaction so a partial
  // failure (e.g. DB connection drop after DELETE but before INSERT) cannot
  // leave the post in an inconsistent state with no categories.
  let updated: typeof posts.$inferSelect;
  try {
    updated = await db.transaction(async (tx) => {
      // Read published_at inside the transaction for a consistent snapshot.
      const [current] = await tx
        .select({ published_at: posts.published_at })
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (!current) throw new Error("Post not found");

      // Set published_at only on first transition to "published".
      const isBecomingPublished =
        status === "published" && !current.published_at;

      const [post] = await tx
        .update(posts)
        .set({
          title,
          slug: uniqueSlug,
          excerpt: excerpt || null,
          type,
          status,
          content_json: content_json ?? null,
          content_html,
          cover_image: cover_image ?? null,
          reading_time_minutes,
          // Mirror latest content into draft columns so the editor reloads correctly.
          draft_content_json: content_json ?? null,
          draft_saved_at: now,
          updated_at: now,
          ...(isBecomingPublished ? { published_at: now } : {}),
        })
        .where(eq(posts.id, postId))
        .returning();

      if (!post) throw new Error("Update failed");

      // Rebuild category relationships: delete existing, insert new selection.
      await tx
        .delete(postCategories)
        .where(eq(postCategories.post_id, postId));

      if (category_ids.length > 0) {
        await tx.insert(postCategories).values(
          category_ids.map((cid) => ({
            post_id: postId,
            category_id: cid,
          })),
        );
      }

      return post;
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Update failed" };
  }

  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${postId}/edit`);
  // Revalidate public routes so ISR pages pick up the change immediately.
  revalidatePath("/");
  revalidatePath(`/[categorySlug]`, "page");
  revalidatePath(`/[categorySlug]/[postSlug]`, "page");

  return { post: updated };
}

// ── deletePost ───────────────────────────────────────────────────────────────

/**
 * Permanently delete a post and all its category relationships.
 * (post_categories rows are cascade-deleted by the FK constraint.)
 */
export async function deletePost(
  postId: string,
): Promise<{ success: true } | { error: string }> {
  await requireAuth();

  await db.delete(posts).where(eq(posts.id, postId));
  revalidatePath("/admin/posts");

  return { success: true };
}

// ── getPostsWithCategories ───────────────────────────────────────────────────

/**
 * Fetch all posts with their category names for the admin post list.
 * Ordered newest-updated first.
 */
export async function getAdminPosts() {
  await requireAuth();

  return db.query.posts.findMany({
    with: {
      postCategories: {
        with: { category: true },
      },
    },
    orderBy: (posts, { desc }) => [desc(posts.updated_at)],
  });
}

// ── getAllCategories ─────────────────────────────────────────────────────────

export async function getAllCategories() {
  return db
    .select()
    .from(categories)
    .orderBy(categories.display_order, categories.name);
}
