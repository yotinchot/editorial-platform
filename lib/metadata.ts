/**
 * Shared SEO/metadata utilities.
 *
 * NEXT_PUBLIC_SITE_URL must be set in the deployment environment.
 * Local dev default: http://localhost:3000
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const SITE_AUTHOR =
  process.env.NEXT_PUBLIC_AUTHOR_NAME ?? "Field Notes";

/** Returns the absolute canonical URL for a given path. */
export function canonicalUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

/** Builds a minimal Open Graph image array from a Cloudinary URL. */
export function ogImages(imageUrl?: string | null): { url: string }[] {
  if (!imageUrl) return [];
  return [{ url: imageUrl }];
}
