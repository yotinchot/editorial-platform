"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { posts, categories, postCategories, tags, postTags } from "@/db/schema";
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
    fitMode: z.enum(["cover", "contain"]).optional(),
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
  status: z.enum(["draft", "published"]),
  category_ids: z.array(z.string().uuid()),
  tag_names: z.array(z.string().min(1).max(100)).default([]),
  content_json: z.unknown().nullable(),
  cover_image: coverImageSchema,
});

const autosaveSchema = z.object({
  draft_content_json: z.unknown(),
});

// ── createPostDraft ──────────────────────────────────────────────────────────

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

  const normalizedDraft = parsed.data.draft_content_json
    ? JSON.parse(JSON.stringify(parsed.data.draft_content_json))
    : null;

  await db
    .update(posts)
    .set({
      draft_content_json: normalizedDraft,
      draft_saved_at: now,
      updated_at: now,
    })
    .where(eq(posts.id, postId));

  return { saved_at: now.toISOString() };
}

// ── updatePost ───────────────────────────────────────────────────────────────

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
    status,
    category_ids,
    tag_names,
    content_json,
    cover_image,
  } = parsed.data;

  if (status === "published" && category_ids.length === 0) {
    return {
      error:
        "A post must belong to at least one category before it can be published.",
    };
  }

  const uniqueSlug = await ensureUniqueSlug(slug, postId);

  let content_html: string | null = null;
  let normalizedJson: unknown = null;
  if (content_json) {
    try {
      normalizedJson = JSON.parse(JSON.stringify(content_json));
      content_html = generatePostHTML(normalizedJson);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[updatePost] generatePostHTML threw:", err);
      return { error: `HTML generation failed: ${detail}` };
    }
  }

  const reading_time_minutes = content_html
    ? calculateReadingTime(content_html)
    : null;

  const now = new Date();

  let updated: typeof posts.$inferSelect;
  try {
    updated = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ published_at: posts.published_at })
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (!current) throw new Error("Post not found");

      const isBecomingPublished =
        status === "published" && !current.published_at;

      const [post] = await tx
        .update(posts)
        .set({
          title,
          slug: uniqueSlug,
          excerpt: excerpt || null,
          // type is intentionally not updated — column kept for backward compat
          status,
          content_json: normalizedJson ?? null,
          content_html,
          cover_image: cover_image ?? null,
          reading_time_minutes,
          draft_content_json: normalizedJson ?? null,
          draft_saved_at: now,
          updated_at: now,
          ...(isBecomingPublished ? { published_at: now } : {}),
        })
        .where(eq(posts.id, postId))
        .returning();

      if (!post) throw new Error("Update failed");

      // Rebuild category relationships
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

      // Upsert tags and rebuild post_tags
      const normalizedTagNames = tag_names
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n) => ({ name: n, slug: titleToSlug(n) || n.toLowerCase().replace(/\s+/g, "-") }));

      await tx.delete(postTags).where(eq(postTags.post_id, postId));

      if (normalizedTagNames.length > 0) {
        // Upsert each tag, returning its id
        const upsertedTags = await Promise.all(
          normalizedTagNames.map(async ({ name, slug }) => {
            const [tag] = await tx
              .insert(tags)
              .values({ name, slug })
              .onConflictDoUpdate({
                target: tags.slug,
                set: { name, updated_at: now },
              })
              .returning({ id: tags.id });
            return tag;
          }),
        );

        await tx.insert(postTags).values(
          upsertedTags.map((t) => ({
            post_id: postId,
            tag_id: t.id,
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
  revalidatePath("/");
  revalidatePath(`/[categorySlug]`, "page");
  revalidatePath(`/[categorySlug]/[postSlug]`, "page");
  revalidatePath(`/tags/[slug]`, "page");

  return { post: updated };
}

// ── deletePost ───────────────────────────────────────────────────────────────

export async function deletePost(
  postId: string,
): Promise<{ success: true } | { error: string }> {
  await requireAuth();

  await db.delete(posts).where(eq(posts.id, postId));
  revalidatePath("/admin/posts");

  return { success: true };
}

// ── getAdminPosts ────────────────────────────────────────────────────────────

export async function getAdminPosts() {
  await requireAuth();

  return db.query.posts.findMany({
    with: {
      postCategories: {
        with: { category: true },
      },
      postTags: {
        with: { tag: true },
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
