import type { Metadata } from "next";

import { AboutPreview } from "@/components/shared/about-preview";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { TopicGrid } from "@/features/categories/components/topic-grid";
import { PostCard } from "@/features/posts/components/post-card";
import { SITE_NAME, SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/constants";
import { getAllCategories } from "@/lib/data/categories";
import { getFeaturedPost, getLatestPosts } from "@/lib/data/posts";
import { canonicalUrl } from "@/lib/metadata";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return {
    title: { absolute: SITE_NAME },
    description: SITE_DESCRIPTION,
    alternates: { canonical: canonicalUrl("/") },
    openGraph: {
      title: SITE_NAME,
      description: SITE_TAGLINE,
      url: canonicalUrl("/"),
      type: "website",
    },
    twitter: {
      title: SITE_NAME,
      description: SITE_TAGLINE,
    },
  };
}

export default async function HomePage() {
  const [featured, latest, allCategories] = await Promise.all([
    getFeaturedPost(),
    getLatestPosts(6),
    getAllCategories(),
  ]);

  const hero = featured ?? latest[0] ?? null;
  const latestForGrid = hero
    ? latest.filter((p) => p.slug !== hero.slug)
    : latest;

  return (
    <>
      {/* Featured Story */}
      {hero && (
        <Container className="pt-12 pb-16 sm:pt-16">
          <PostCard post={hero} orientation="horizontal" />
        </Container>
      )}

      {/* Latest Stories */}
      {latestForGrid.length > 0 && (
        <Container className="space-y-8 py-16">
          <SectionHeading title="Latest Stories" />
          <div className="grid gap-10 sm:grid-cols-3">
            {latestForGrid.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </Container>
      )}

      {/* Explore Topics */}
      {allCategories.length > 0 && (
        <Container className="space-y-8 py-16">
          <SectionHeading title="Explore Topics" />
          <TopicGrid categories={allCategories} />
        </Container>
      )}

      {/* About Preview */}
      <Container className="py-16">
        <AboutPreview />
      </Container>
    </>
  );
}
