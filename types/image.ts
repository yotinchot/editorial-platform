/**
 * Shared image metadata type used throughout the editorial platform.
 *
 * Used for:
 *  - cover_image column (posts table)
 *  - inline editor images
 *  - future travel gallery nodes
 *  - future reading book cover nodes
 *
 * focalX / focalY drive CSS `object-position` and Cloudinary gravity
 * transforms so the subject stays in frame across responsive crops.
 */
export type EditorialImage = {
  /** Cloudinary secure delivery URL. */
  url: string;
  /** Descriptive alt text for accessibility and SEO. */
  alt: string;
  /** Intrinsic pixel width — prevents Cumulative Layout Shift (CLS). */
  width: number;
  /** Intrinsic pixel height — same. */
  height: number;
  /** Horizontal focal point, normalised 0.0–1.0 (0 = left, 1 = right). */
  focalX: number;
  /** Vertical focal point, normalised 0.0–1.0 (0 = top, 1 = bottom). */
  focalY: number;
  /** Cloudinary public_id — stored for future transformation use. */
  publicId?: string;
  /** CSS object-fit mode. Cover and contain require a container height; natural lets the image size freely. */
  fitMode?: "cover" | "contain" | "natural";
};
