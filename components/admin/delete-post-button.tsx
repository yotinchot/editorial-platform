"use client";

import { useTransition } from "react";
import { deletePost } from "@/actions/posts";

interface DeletePostButtonProps {
  postId: string;
}

/**
 * Delete button for the post list.
 * Shows a browser confirm dialog before calling the deletePost server action.
 */
export function DeletePostButton({ postId }: DeletePostButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    startTransition(async () => {
      await deletePost(postId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="shrink-0 text-xs text-foreground/35 transition-colors hover:text-destructive disabled:opacity-50"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
