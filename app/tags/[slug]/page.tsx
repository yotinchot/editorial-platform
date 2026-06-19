import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { Container } from "@/components/shared/container";
import { PostCard } from "@/features/posts/components/post-card";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { getPostsByTag } from "@/lib/data/posts";
import { SITE_NAME } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await db.query.tags.findFirst({
    where: eq(tags.slug, slug),
    columns: { name: true },
  });
  if (!tag) return {};
  return {
    title: `${tag.name} — ${SITE_NAME}`,
    description: `Posts tagged with "${tag.name}"`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [tag, tagPosts] = await Promise.all([
    db.query.tags.findFirst({
      where: eq(tags.slug, slug),
      columns: { name: true, slug: true },
    }),
    getPostsByTag(slug),
  ]);

  if (!tag) notFound();

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-10">
        <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Tag</p>
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
          {tag.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {tagPosts.length === 0
            ? "No published posts yet."
            : `${tagPosts.length} ${tagPosts.length === 1 ? "post" : "posts"}`}
        </p>
      </div>

      {tagPosts.length > 0 && (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tagPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </Container>
  );
}
