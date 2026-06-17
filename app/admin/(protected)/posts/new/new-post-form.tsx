"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createPostDraft } from "@/actions/posts";
import { Button } from "@/components/ui/button";

/**
 * New post creation form.
 * On submit: calls createPostDraft → navigates to the edit page.
 */
export function NewPostForm() {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createPostDraft({ title: title.trim() });
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push(`/admin/posts/${result.post.id}/edit`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-foreground"
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Untitled"
          required
          autoFocus
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <Button
        type="submit"
        disabled={isPending || !title.trim()}
        className="w-full"
      >
        {isPending ? "Creating…" : "Create Draft"}
      </Button>
    </form>
  );
}
