import { AboutPreview } from "@/components/shared/about-preview";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { TopicGrid } from "@/features/categories/components/topic-grid";
import { PostCard } from "@/features/posts/components/post-card";
import {
  FEATURED_POST,
  PLACEHOLDER_CATEGORIES,
  PLACEHOLDER_POSTS,
} from "@/lib/placeholder-data";

export default function HomePage() {
  const latestPosts = PLACEHOLDER_POSTS.slice(1, 4);
  const travelPosts = PLACEHOLDER_POSTS.filter((post) => post.type === "travel");
  const readingPosts = PLACEHOLDER_POSTS.filter((post) => post.type === "reading");

  return (
    <>
      {/* 1. Featured Story */}
      <Container className="pt-12 pb-16 sm:pt-16">
        <PostCard post={FEATURED_POST} orientation="horizontal" />
      </Container>

      {/* 2. Latest Stories */}
      <Container className="space-y-8 py-16">
        <SectionHeading title="Latest Stories" href="/latest" />
        <div className="grid gap-10 sm:grid-cols-3">
          {latestPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </Container>

      {/* 3. Travel Stories */}
      <Container className="space-y-8 py-16">
        <SectionHeading
          title="Travel Stories"
          description="Itineraries and notes from the road."
          href="/travel"
        />
        <div className="grid gap-10 sm:grid-cols-3">
          {travelPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </Container>

      {/* 4. Reading Notes */}
      <Container className="space-y-8 py-16">
        <SectionHeading
          title="Reading Notes"
          description="Structured reflections on books worth sitting with."
          href="/reading"
        />
        <div className="grid gap-10 sm:grid-cols-3">
          {readingPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </Container>

      {/* 5. Explore Topics */}
      <Container className="space-y-8 py-16">
        <SectionHeading title="Explore Topics" />
        <TopicGrid categories={PLACEHOLDER_CATEGORIES} />
      </Container>

      {/* 6. About Preview */}
      <Container className="py-16">
        <AboutPreview />
      </Container>
    </>
  );
}
