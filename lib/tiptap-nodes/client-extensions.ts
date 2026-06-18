/**
 * Client-only TipTap extension bundle.
 *
 * Defines ImageNode, ReadingBlock, and TravelGalleryBlock INLINE — never
 * importing their definitions from the server-safe node files (editor-image-node.ts,
 * reading-block.ts, travel-gallery-block.ts). This breaks the shared module
 * boundary that would otherwise cause React RSC proxy errors when those same
 * modules are imported by lib/html.ts inside a Server Action.
 *
 * addAttributes() and parseHTML() are kept identical to the server versions so
 * the ProseMirror schema is compatible and JSON round-trips correctly.
 * renderHTML() is simplified — NodeViews handle visual rendering in the editor.
 *
 * Import this ONLY from client components (e.g. tiptap-editor.tsx).
 * Never import from server-side HTML generation code.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { InlineImageNodeView } from "@/components/editor/blocks/inline-image-node-view";
import { ReadingBlockView } from "@/components/editor/blocks/reading-block-view";
import { TravelGalleryBlockView } from "@/components/editor/blocks/travel-gallery-block-view";

// ── ImageNode ────────────────────────────────────────────────────────────────
// Extends base Image with width, height, fitMode, and focal point attributes.
// Schema must mirror editor-image-node.ts (server). NodeView is client-only.

export const ImageNode = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
        parseHTML: (el) => el.getAttribute("width"),
      },
      height: {
        default: null,
        renderHTML: (attrs) => (attrs.height ? { height: attrs.height } : {}),
        parseHTML: (el) => el.getAttribute("height"),
      },
      fitMode: {
        default: "natural",
        renderHTML: () => ({}),
        parseHTML: (el) => el.getAttribute("data-fit-mode") ?? "natural",
      },
      focalX: {
        default: 0.5,
        renderHTML: () => ({}),
        parseHTML: () => 0.5,
      },
      focalY: {
        default: 0.5,
        renderHTML: () => ({}),
        parseHTML: () => 0.5,
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineImageNodeView);
  },
});

// ── ReadingBlock ─────────────────────────────────────────────────────────────
// Atom node for book reflections. addAttributes must match reading-block.ts.

export const ReadingBlock = Node.create({
  name: "readingBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      bookCover: {
        default: null,
        renderHTML: (attrs) => ({
          "data-book-cover": attrs.bookCover
            ? JSON.stringify(attrs.bookCover)
            : "",
        }),
        parseHTML: (el) => {
          const val = el.getAttribute("data-book-cover");
          if (!val) return null;
          try {
            return JSON.parse(val);
          } catch {
            return null;
          }
        },
      },

      bookTitle: {
        default: "",
        renderHTML: (attrs) => ({ "data-book-title": attrs.bookTitle ?? "" }),
        parseHTML: (el) => el.getAttribute("data-book-title") ?? "",
      },

      author: {
        default: "",
        renderHTML: (attrs) => ({ "data-author": attrs.author ?? "" }),
        parseHTML: (el) => el.getAttribute("data-author") ?? "",
      },

      rating: {
        default: null,
        renderHTML: (attrs) => ({
          "data-rating": attrs.rating != null ? String(attrs.rating) : "",
        }),
        parseHTML: (el) => {
          const val = el.getAttribute("data-rating");
          if (!val) return null;
          const n = parseInt(val, 10);
          return isNaN(n) ? null : Math.min(5, Math.max(1, n));
        },
      },

      favoriteQuote: {
        default: "",
        renderHTML: (attrs) => ({
          "data-favorite-quote": attrs.favoriteQuote ?? "",
        }),
        parseHTML: (el) => el.getAttribute("data-favorite-quote") ?? "",
      },

      keyTakeaways: {
        default: [] as string[],
        renderHTML: (attrs) => ({
          "data-key-takeaways": JSON.stringify(
            Array.isArray(attrs.keyTakeaways) ? attrs.keyTakeaways : [],
          ),
        }),
        parseHTML: (el) => {
          const val = el.getAttribute("data-key-takeaways");
          if (!val) return [];
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? (parsed as string[]) : [];
          } catch {
            return [];
          }
        },
      },

      whoShouldReadThis: {
        default: "",
        renderHTML: (attrs) => ({
          "data-who-should-read": attrs.whoShouldReadThis ?? "",
        }),
        parseHTML: (el) => el.getAttribute("data-who-should-read") ?? "",
      },

      readingStatus: {
        default: "want-to-read",
        renderHTML: (attrs) => ({
          "data-reading-status": attrs.readingStatus ?? "want-to-read",
        }),
        parseHTML: (el) =>
          el.getAttribute("data-reading-status") ?? "want-to-read",
      },

      finishedDate: {
        default: null,
        renderHTML: (attrs) => ({
          "data-finished-date": attrs.finishedDate ?? "",
        }),
        parseHTML: (el) => el.getAttribute("data-finished-date") || null,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-node="readingBlock"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-node": "readingBlock",
        class: "reading-block",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReadingBlockView);
  },
});

// ── TravelGalleryBlock ───────────────────────────────────────────────────────
// Atom node for photo galleries. addAttributes must match travel-gallery-block.ts.

export const TravelGalleryBlock = Node.create({
  name: "travelGalleryBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      layout: {
        default: "single",
        renderHTML: (attrs) => ({
          "data-layout": attrs.layout ?? "single",
        }),
        parseHTML: (el) => el.getAttribute("data-layout") ?? "single",
      },

      images: {
        default: [],
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (parsed as any[]).map((img, i) => ({
              fitMode: "cover",
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

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-node": "travelGalleryBlock",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TravelGalleryBlockView);
  },
});
