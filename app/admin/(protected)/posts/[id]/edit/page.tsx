import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { categories, posts } from "@/db/schema";
import { PostEditor } from "./post-editor";

export const metadata: Metadata = {
  title: "Edit Post — Field Notes Admin",
  robots: { index: false, follow: false },
};

/**
 * /admin/posts/[id]/edit
 *
 * Server Component: fetches the post with its category relations and all
 * available categories, then delegates rendering to the PostEditor client
 * component.
 *
 * Draft recovery: passes `draft_content_json ?? content_json ?? null` to the
 * editor so the client always loads the most recent unsaved draft first.
 * (Logic lives inside PostEditor.)
 */
export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [post, allCategories] = await Promise.all([
    db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        postCategories: {
          with: { category: true },
        },
      },
    }),
    db
      .select()
      .from(categories)
      .orderBy(asc(categories.display_order), asc(categories.name)),
  ]);

  if (!post) notFound();

  return <PostEditor post={post} allCategories={allCategories} />;
}
