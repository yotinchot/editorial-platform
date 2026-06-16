import { cn } from "@/lib/utils";

/**
 * Stand-in for a real cover image. Phase 1 has no Cloudinary wiring yet, so
 * this renders a quiet textured panel instead of a broken <img>. Swap for
 * `next/image` once `coverImageUrl` exists on the post record.
 */
export function PostCoverPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-foreground/[0.08]" />
    </div>
  );
}
