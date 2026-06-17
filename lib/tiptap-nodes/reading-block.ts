/**
 * ReadingBlock — custom TipTap atom node for book reflections.
 *
 * Server-safe: no React or DOM imports. This file is imported by both
 * the client editor (tiptap-editor.tsx, which adds the NodeView) and the
 * server-side HTML generator (lib/html.ts, which uses renderHTML only).
 *
 * Storage strategy:
 *  - All data lives in node attrs (JSON-serializable).
 *  - In TipTap JSON (content_json / draft_content_json), complex attrs
 *    (bookCover, keyTakeaways) are stored as native JS objects/arrays.
 *  - In rendered HTML (content_html), they are serialised to data-* attrs
 *    so parseHTML can reconstruct the node from HTML if needed.
 */
import { Node, mergeAttributes } from "@tiptap/core";

// ── Types ───────────────────────────────────────────────────────────────────

export type ReadingStatus = "want-to-read" | "reading" | "finished";

export interface ReadingBlockCover {
  url: string;
  alt: string;
  width: number;
  height: number;
  publicId?: string;
}

export interface ReadingBlockAttrs {
  bookCover: ReadingBlockCover | null;
  bookTitle: string;
  author: string;
  /** 1–5, null if not rated */
  rating: number | null;
  favoriteQuote: string;
  keyTakeaways: string[];
  whoShouldReadThis: string;
  readingStatus: ReadingStatus;
  /** ISO date string, null unless status === "finished" */
  finishedDate: string | null;
}

// ── Node ────────────────────────────────────────────────────────────────────

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
            return JSON.parse(val) as ReadingBlockCover;
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
        default: "want-to-read" as ReadingStatus,
        renderHTML: (attrs) => ({
          "data-reading-status": attrs.readingStatus ?? "want-to-read",
        }),
        parseHTML: (el) =>
          (el.getAttribute("data-reading-status") ??
            "want-to-read") as ReadingStatus,
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

  renderHTML({ node, HTMLAttributes }) {
    const a = node.attrs as ReadingBlockAttrs;

    // ── Build child specs ──────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any[] = [];

    // Cover image
    if (a.bookCover?.url) {
      children.push([
        "figure",
        { class: "reading-block__cover" },
        [
          "img",
          {
            src: a.bookCover.url,
            alt: a.bookCover.alt || "",
            width: String(a.bookCover.width || ""),
            height: String(a.bookCover.height || ""),
            loading: "lazy",
          },
        ],
      ]);
    }

    // Main body children
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any[] = [
      ["h3", { class: "reading-block__title" }, a.bookTitle || "Untitled"],
      ["p", { class: "reading-block__author" }, a.author || ""],
    ];

    if (a.rating != null) {
      const stars =
        "★".repeat(Math.min(5, Math.max(1, a.rating))) +
        "☆".repeat(Math.max(0, 5 - a.rating));
      body.push(["p", { class: "reading-block__rating", "aria-label": `Rating: ${a.rating} out of 5` }, stars]);
    }

    const statusLabels: Record<ReadingStatus, string> = {
      "want-to-read": "Want to read",
      reading: "Currently reading",
      finished: "Finished",
    };
    body.push([
      "p",
      {
        class: `reading-block__status reading-block__status--${a.readingStatus ?? "want-to-read"}`,
      },
      statusLabels[a.readingStatus ?? "want-to-read"] ?? a.readingStatus ?? "",
    ]);

    if (a.finishedDate && a.readingStatus === "finished") {
      body.push(["p", { class: "reading-block__finished-date" }, a.finishedDate]);
    }

    if (a.favoriteQuote) {
      body.push([
        "blockquote",
        { class: "reading-block__quote" },
        a.favoriteQuote,
      ]);
    }

    const takeaways = (a.keyTakeaways ?? []).filter(Boolean);
    if (takeaways.length) {
      body.push([
        "ul",
        { class: "reading-block__takeaways" },
        ...takeaways.map((t) => ["li", {}, t]),
      ]);
    }

    if (a.whoShouldReadThis) {
      body.push(["p", { class: "reading-block__who" }, a.whoShouldReadThis]);
    }

    children.push(["div", { class: "reading-block__body" }, ...body]);

    // ── Wrapper ────────────────────────────────────────────────────────────
    // HTMLAttributes contains all data-* attrs from addAttributes[x].renderHTML
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-node": "readingBlock",
        class: "reading-block",
      }),
      ...children,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as unknown as any;
  },
});
