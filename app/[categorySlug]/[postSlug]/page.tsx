import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleContent } from "@/components/article/article-content";
import { TableOfContents } from "@/components/article/table-of-contents";
import { Container } from "@/components/shared/container";
import { formatPostDate, formatReadingTime } from "@/lib/format";
import { getPostDetail } from "@/lib/data/posts";
import { extractToc } from "@/lib/toc";
import { SITE_NAME } from "@/lib/constants";
import { canonicalUrl, SITE_AUTHOR } from "@/lib/metadata";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string; postSlug: string }>;
}): Promise<Metadata> {
  const { categorySlug, postSlug } = await params;
  const post = await getPostDetail(categorySlug, postSlug);
  if (!post) return {};
  const url = canonicalUrl(`/${categorySlug}/${postSlug}`);
  const description = post.excerpt ?? undefined;
  const images = post.coverImage ? [{ url: post.coverImage.url }] : [];
  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      url,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [SITE_AUTHOR],
      images,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ categorySlug: string; postSlug: string }>;
}) {
  const { categorySlug, postSlug } = await params;
  const post = await getPostDetail(categorySlug, postSlug);
  if (!post) notFound();

  const toc = extractToc(post.contentHtml);
  const hasToc = toc.length >= 2;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    url: canonicalUrl(`/${categorySlug}/${postSlug}`),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: SITE_AUTHOR },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: canonicalUrl("/"),
    },
    ...(post.coverImage
      ? { image: { "@type": "ImageObject", url: post.coverImage.url } }
      : {}),
  };

  return (
    <>
      {/* Cover image */}
      {post.coverImage && (
        <div className="relative h-[55vh] min-h-64 max-h-[640px] w-full overflow-hidden bg-muted">
          <Image
            src={post.coverImage.url}
            alt={post.coverImage.alt}
            fill
            priority
            className={post.coverImage.fitMode === "contain" ? "object-contain" : "object-cover"}
            style={{
              objectPosition: `${(post.coverImage.focalX ?? 0.5) * 100}% ${(post.coverImage.focalY ?? 0.5) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Article header */}
      <Container className="pt-12 pb-8 sm:pt-16 sm:pb-10">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-5 flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href={`/${post.categorySlug}`}
              className="hover:text-foreground transition-colors"
            >
              {post.category}
            </Link>
          </nav>

          <h1 className="font-serif text-4xl italic leading-tight sm:text-5xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <time dateTime={post.publishedAt}>
              {formatPostDate(post.publishedAt)}
            </time>
            {post.readingTimeMinutes != null && (
              <>
                <span aria-hidden>·</span>
                <span>{formatReadingTime(post.readingTimeMinutes)}</span>
              </>
            )}
          </div>
        </div>
      </Container>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Article body */}
      <Container className="pb-20">
        <div
          className={
            hasToc
              ? "grid gap-16 lg:grid-cols-[1fr_220px] mx-auto"
              : "max-w-2xl mx-auto"
          }
        >
          {/* Content — max-w-2xl keeps reading measure consistent with the non-TOC path */}
          <div className="min-w-0 max-w-2xl mx-auto">
            {post.contentHtml ? (
              <ArticleContent html={post.contentHtml} />
            ) : (
              <p className="text-muted-foreground">Content coming soon.</p>
            )}
          </div>

          {/* TOC sidebar — only when there are enough headings */}
          {hasToc && (
            <aside className="hidden lg:block">
              <div className="sticky top-8">
                <TableOfContents entries={toc} />
              </div>
            </aside>
          )}
        </div>
      </Container>
    </>
  );
}
