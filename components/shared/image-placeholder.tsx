import { cn } from "@/lib/utils";

/**
 * Generic placeholder panel used wherever a real image isn't available yet.
 *
 * Usage:
 * - Post cover thumbnails (before Cloudinary wiring)
 * - Author portrait on About page
 * - Any image slot that hasn't been filled
 *
 * Swap for `next/image` with a real `src` when the image CDN is connected.
 */
export function ImagePlaceholder({ className }: { className?: string }) {
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
