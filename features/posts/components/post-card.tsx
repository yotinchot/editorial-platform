import Image from "next/image";
import Link from "next/link";

import { PostCoverPlaceholder } from "@/features/posts/components/post-cover-placeholder";
import type { PostSummary } from "@/features/posts/types/post";
import { formatPostDate, formatReadingTime } from "@/lib/format";
import { containsThai } from "@/lib/thai-font";

interface PostCardProps {
  post: PostSummary;
  /** "horizontal" is used for the featured hero slot. */
  orientation?: "vertical" | "horizontal";
}

export function PostCard({ post, orientation = "vertical" }: PostCardProps) {
  const href = `/${post.categorySlug}/${post.slug}`;

  if (orientation === "horizontal") {
    const titleIsThai = containsThai(post.title);
    return (
      <Link href={href} className="group grid gap-6 sm:grid-cols-2 sm:gap-10">
        <PostCover post={post} className="aspect-4/3" />
        <div className="flex flex-col justify-center">
          <PostMeta post={post} />
          <h3
            className={
              titleIsThai
                ? "mt-3 font-kanit font-medium text-3xl leading-tight transition-colors group-hover:text-accent sm:text-4xl"
                : "mt-3 font-serif text-3xl italic leading-tight transition-colors group-hover:text-accent sm:text-4xl"
            }
          >
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="mt-4 text-muted-foreground">{post.excerpt}</p>
          ) : null}
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group flex flex-col">
      <PostCover post={post} className="aspect-4/3" />
      <PostMeta post={post} className="mt-4" />
      <h3 className="mt-2 font-serif text-xl leading-snug transition-colors group-hover:text-accent">
        {post.title}
      </h3>
      {post.excerpt ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {post.excerpt}
        </p>
      ) : null}
    </Link>
  );
}

function PostCover({
  post,
  className,
}: {
  post: PostSummary;
  className?: string;
}) {
  if (post.coverImage) {
    const { url, alt, width, height, focalX = 0.5, focalY = 0.5 } =
      post.coverImage;
    return (
      <div className={`overflow-hidden rounded-sm ${className ?? ""}`}>
        <Image
          src={url}
          alt={alt}
          width={width}
          height={height}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          style={{
            objectPosition: `${focalX * 100}% ${focalY * 100}%`,
          }}
        />
      </div>
    );
  }
  return <PostCoverPlaceholder className={className} />;
}

function PostMeta({
  post,
  className,
}: {
  post: PostSummary;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 text-xs tracking-wide text-muted-foreground uppercase ${className ?? ""}`}
    >
      <span>{post.category}</span>
      <span aria-hidden>·</span>
      <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
      {post.readingTimeMinutes != null && (
        <>
          <span aria-hidden>·</span>
          <span>{formatReadingTime(post.readingTimeMinutes)}</span>
        </>
      )}
    </div>
  );
}
