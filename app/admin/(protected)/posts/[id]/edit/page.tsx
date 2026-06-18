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
        postTags: {
          with: { tag: true },
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
