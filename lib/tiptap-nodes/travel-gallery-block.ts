/**
 * TravelGalleryBlock — custom TipTap atom node for photo galleries.
 *
 * Server-safe: no React or DOM imports. Imported by both the client editor
 * and the server-side HTML generator.
 *
 * Layouts:
 *   single   — 1 full-width image
 *   two-up   — 2 images side by side
 *   three-up — 3 images (1 dominant + 2 supporting)
 *   four-up  — 4 images in a 2×2 grid
 *
 * Images arrive from Cloudinary uploads (same pipeline as Phase 5).
 * The `images` array only stores actually-uploaded images; empty slots are
 * inferred at render time from the layout's max count.
 */
import { Node, mergeAttributes } from "@tiptap/core";

// ── Types ───────────────────────────────────────────────────────────────────

export type GalleryLayout = "single" | "two-up" | "three-up" | "four-up";

export interface GalleryImage {
  url: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  /**
   * Canonical slot position (0-based). Stored alongside the image so the
   * dense array can be re-mapped to the correct visual slot even after
   * non-sequential uploads, removals, or layout changes.
   */
  slotIndex: number;
  publicId?: string;
}

export interface TravelGalleryBlockAttrs {
  layout: GalleryLayout;
  images: GalleryImage[];
}

/** Maximum number of images for each layout. */
export const LAYOUT_MAX: Record<GalleryLayout, number> = {
  single: 1,
  "two-up": 2,
  "three-up": 3,
  "four-up": 4,
};

// ── Node ────────────────────────────────────────────────────────────────────

export const TravelGalleryBlock = Node.create({
  name: "travelGalleryBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      layout: {
        default: "single" as GalleryLayout,
        renderHTML: (attrs) => ({
          "data-layout": attrs.layout ?? "single",
        }),
        parseHTML: (el) =>
          (el.getAttribute("data-layout") ?? "single") as GalleryLayout,
      },

      images: {
        default: [] as GalleryImage[],
        renderHTML: (attrs) => ({
          "data-images": JSON.stringify(
            Array.isArray(attrs.images) ? attrs.images : [],
          ),
        }),
        parseHTML: (el) => {
          const val = el.getAttribute("data-images");
          if (!val) return [];
          try {
            const parsed = JSON.parse(val);
            if (!Array.isArray(parsed)) return [];
            // Backward-compat: assign a fallback slotIndex for images stored
            // before Phase 6.1 (which introduced the slotIndex field).
            return (parsed as GalleryImage[]).map((img, i) => ({
              ...img,
              slotIndex: img.slotIndex ?? i,
            }));
          } catch {
            return [];
          }
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-node="travelGalleryBlock"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const a = node.attrs as TravelGalleryBlockAttrs;
    const layout = a.layout ?? "single";
    const images = Array.isArray(a.images) ? a.images : [];

    // Sort by slotIndex so the rendered HTML matches the visual slot order
    // regardless of the order images were uploaded or stored in the array.
    const sorted = [...images]
      .filter((img) => img?.url)
      .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const figures: any[] = sorted.map((img) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const figChildren: any[] = [
        [
          "img",
          {
            src: img.url,
            alt: img.alt || "",
            width: String(img.width || ""),
            height: String(img.height || ""),
            loading: "lazy",
          },
        ],
      ];
      if (img.caption) {
        figChildren.push(["figcaption", {}, img.caption]);
      }
      return ["figure", { class: "travel-gallery__item" }, ...figChildren];
    });

    // Note: HTMLAttributes already contains data-layout from addAttributes.layout.renderHTML,
    // so we do not repeat it here (LOW-6 fix).
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-node": "travelGalleryBlock",
        class: `travel-gallery travel-gallery--${layout}`,
      }),
      ...figures,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as unknown as any;
  },
});
