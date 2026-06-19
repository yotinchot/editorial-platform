import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/shared/container";
import { PostCard } from "@/features/posts/components/post-card";
import { getCategoryBySlug } from "@/lib/data/categories";
import { getPostsByCategory } from "@/lib/data/posts";
import { canonicalUrl } from "@/lib/metadata";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return {};
  const description = category.description || undefined;
  const url = canonicalUrl(`/${categorySlug}`);
  return {
    title: category.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: category.name,
      description,
      url,
      type: "website",
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;

  const [category, categoryPosts] = await Promise.all([
    getCategoryBySlug(categorySlug),
    getPostsByCategory(categorySlug),
  ]);

  if (!category) notFound();

  return (
    <>
      {/* Category header */}
      <Container className="pt-14 pb-10 sm:pt-20 sm:pb-14">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Category
        </p>
        <h1 className="mt-2 font-serif text-4xl italic sm:text-5xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-3 max-w-xl text-muted-foreground">
            {category.description}
          </p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          {category.postCount} {category.postCount === 1 ? "story" : "stories"}
        </p>
      </Container>

      {/* Post grid */}
      <Container className="pb-20">
        {categoryPosts.length > 0 ? (
          <div className="grid gap-10 sm:grid-cols-3">
            {categoryPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-muted-foreground">
            No published stories yet.
          </p>
        )}
      </Container>
    </>
  );
}
