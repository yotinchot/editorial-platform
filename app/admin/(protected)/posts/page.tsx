import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { buttonVariants } from "@/components/ui/button";
import { DeletePostButton } from "@/components/admin/delete-post-button";
import { cn } from "@/lib/utils";
import { formatPostDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Posts — Field Notes Admin",
  robots: { index: false, follow: false },
};

export default async function PostsPage() {
  const allPosts = await db.query.posts.findMany({
    with: {
      postCategories: {
        with: { category: true },
      },
    },
    orderBy: [desc(posts.updated_at)],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Posts</h2>
          <p className="mt-0.5 text-sm text-foreground/50">
            {allPosts.length === 0
              ? "No posts yet"
              : `${allPosts.length} ${allPosts.length === 1 ? "post" : "posts"}`}
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          + New Post
        </Link>
      </div>

      {/* List */}
      {allPosts.length === 0 ? (
        <div className="rounded-sm border border-border py-20 text-center">
          <p className="text-sm text-foreground/50">No posts yet.</p>
          <p className="mt-1 text-sm text-foreground/40">
            Create your first post to get started.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-sm border border-border">
          {allPosts.map((post) => {
            const cats = post.postCategories
              .map((pc) => pc.category.name)
              .join(", ");

            return (
              <div
                key={post.id}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30"
              >
                {/* Title + meta */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">
                    {post.title || (
                      <span className="italic text-foreground/40">
                        Untitled
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-foreground/40">
                    <span className="capitalize">{post.type}</span>
                    {cats && <span>{cats}</span>}
                    <span>{formatPostDate(post.updated_at.toISOString())}</span>
                  </div>
                </div>

                {/* Status badge */}
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    post.status === "published"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "bg-muted text-foreground/50",
                  )}
                >
                  {post.status}
                </span>

                {/* Edit link */}
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "xs" }),
                    "shrink-0",
                  )}
                >
                  Edit
                </Link>

                {/* Delete — client component for confirm dialog */}
                <DeletePostButton postId={post.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
