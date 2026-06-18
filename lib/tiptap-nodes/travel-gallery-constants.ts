import type { GalleryLayout } from "./travel-gallery-block";

/** Maximum number of images allowed for each gallery layout. */
export const LAYOUT_MAX: Record<GalleryLayout, number> = {
  single: 1,
  "two-up": 2,
  "three-up": 3,
  "four-up": 4,
};
