import Link from "next/link";

import { PostCoverPlaceholder } from "@/features/posts/components/post-cover-placeholder";
import type { PostSummary } from "@/features/posts/types/post";
import { formatPostDate, formatReadingTime } from "@/lib/format";

interface PostCardProps {
  post: PostSummary;
  /** "horizontal" is used for the featured hero slot. */
  orientation?: "vertical" | "horizontal";
}

export function PostCard({ post, orientation = "vertical" }: PostCardProps) {
  const href = `/${post.categorySlug}/${post.slug}`;

  if (orientation === "horizontal") {
    return (
      <Link href={href} className="group grid gap-6 sm:grid-cols-2 sm:gap-10">
        <PostCoverPlaceholder className="aspect-4/3" />
        <div className="flex flex-col justify-center">
          <PostMeta post={post} />
          <h3 className="mt-3 font-serif text-3xl italic leading-tight transition-colors group-hover:text-accent sm:text-4xl">
            {post.title}
          </h3>
          <p className="mt-4 text-muted-foreground">{post.excerpt}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group flex flex-col">
      <PostCoverPlaceholder className="aspect-4/3" />
      <PostMeta post={post} className="mt-4" />
      <h3 className="mt-2 font-serif text-xl leading-snug transition-colors group-hover:text-accent">
        {post.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
        {post.excerpt}
      </p>
    </Link>
  );
}

function PostMeta({
  post,
  className,
}: {
  post: PostSummary;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 text-xs tracking-wide text-muted-foreground uppercase ${className ?? ""}`}>
      <span>{post.category}</span>
      <span aria-hidden>·</span>
      <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
      <span aria-hidden>·</span>
      <span>{formatReadingTime(post.readingTimeMinutes)}</span>
    </div>
  );
}
