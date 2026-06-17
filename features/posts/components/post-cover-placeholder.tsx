/**
 * Re-export from the canonical shared location.
 * The visual component lives in `components/shared/image-placeholder.tsx`
 * so that shared components don't depend on feature internals.
 *
 * Import `ImagePlaceholder` directly in new code; this file exists only
 * to avoid breaking any imports that already use this path.
 */
export { ImagePlaceholder as PostCoverPlaceholder } from "@/components/shared/image-placeholder";
