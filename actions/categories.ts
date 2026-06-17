"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { getSessionToken } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { isReservedCategorySlug } from "@/lib/reserved-slugs";

// ── Auth guard ──────────────────────────────────────────────────────────────

async function requireAuth(): Promise<void> {
  const { redirect } = await import("next/navigation");
  const token = await getSessionToken();
  if (!token || !(await verifySession(token))) {
    redirect("/admin/login");
  }
}

// ── Zod schemas ──────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
      "Slug may only contain lowercase letters, numbers, and hyphens",
    ),
  description: z.string().max(500).optional().default(""),
  display_order: z.number().int().min(0).optional().default(0),
});

// ── createCategory ───────────────────────────────────────────────────────────

export async function createCategory(
  rawData: unknown,
): Promise<{ category: typeof categories.$inferSelect } | { error: string }> {
  await requireAuth();

  const parsed = categorySchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, slug, description, display_order } = parsed.data;

  if (isReservedCategorySlug(slug)) {
    return {
      error: `"${slug}" is a reserved application route and cannot be used as a category slug.`,
    };
  }

  // Check for uniqueness before INSERT to surface a clear error rather than a
  // DB unique-constraint violation.
  const existing = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
    columns: { id: true },
  });
  if (existing) {
    return { error: `A category with slug "${slug}" already exists.` };
  }

  const [category] = await db
    .insert(categories)
    .values({ name, slug, description: description || null, display_order })
    .returning();

  revalidatePath("/");
  revalidatePath("/admin");

  return { category };
}

// ── updateCategory ───────────────────────────────────────────────────────────

export async function updateCategory(
  categoryId: string,
  rawData: unknown,
): Promise<{ category: typeof categories.$inferSelect } | { error: string }> {
  await requireAuth();

  const parsed = categorySchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, slug, description, display_order } = parsed.data;

  if (isReservedCategorySlug(slug)) {
    return {
      error: `"${slug}" is a reserved application route and cannot be used as a category slug.`,
    };
  }

  // Uniqueness check — exclude the category being updated from the search.
  const conflict = await db.query.categories.findFirst({
    where: and(eq(categories.slug, slug), ne(categories.id, categoryId)),
    columns: { id: true },
  });
  if (conflict) {
    return { error: `A category with slug "${slug}" already exists.` };
  }

  const now = new Date();
  const [category] = await db
    .update(categories)
    .set({ name, slug, description: description || null, display_order, updated_at: now })
    .where(eq(categories.id, categoryId))
    .returning();

  if (!category) {
    return { error: "Category not found." };
  }

  revalidatePath("/");
  revalidatePath(`/${slug}`);
  revalidatePath("/admin");

  return { category };
}

// ── deleteCategory ───────────────────────────────────────────────────────────

export async function deleteCategory(
  categoryId: string,
): Promise<{ success: true } | { error: string }> {
  await requireAuth();

  await db.delete(categories).where(eq(categories.id, categoryId));

  revalidatePath("/");
  revalidatePath("/admin");

  return { success: true };
}
