/**
 * Verify that server-side HTML generation works for all node types.
 * Run with: node scripts/verify-html.mjs
 *
 * Uses the same import path as lib/html.ts to catch module resolution issues.
 */

import { generateHTML } from "@tiptap/html/server";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Node, mergeAttributes } from "@tiptap/core";

// ── Inline server extensions (mirrors server-extensions.ts) ─────────────────

const ImageNode = Image.extend({
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
    };
  },
});

const ReadingBlock = Node.create({
  name: "readingBlock",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      bookCover: { default: null, renderHTML: (attrs) => ({ "data-book-cover": attrs.bookCover ? JSON.stringify(attrs.bookCover) : "" }), parseHTML: (el) => { const v = el.getAttribute("data-book-cover"); return v ? JSON.parse(v) : null; } },
      bookTitle: { default: "", renderHTML: (attrs) => ({ "data-book-title": attrs.bookTitle ?? "" }), parseHTML: (el) => el.getAttribute("data-book-title") ?? "" },
      author: { default: "", renderHTML: (attrs) => ({ "data-author": attrs.author ?? "" }), parseHTML: (el) => el.getAttribute("data-author") ?? "" },
      rating: { default: null, renderHTML: (attrs) => ({ "data-rating": attrs.rating != null ? String(attrs.rating) : "" }), parseHTML: (el) => { const v = el.getAttribute("data-rating"); return v ? parseInt(v, 10) : null; } },
      favoriteQuote: { default: "", renderHTML: (attrs) => ({ "data-favorite-quote": attrs.favoriteQuote ?? "" }), parseHTML: (el) => el.getAttribute("data-favorite-quote") ?? "" },
      keyTakeaways: { default: [], renderHTML: (attrs) => ({ "data-key-takeaways": JSON.stringify(Array.isArray(attrs.keyTakeaways) ? attrs.keyTakeaways : []) }), parseHTML: (el) => { try { return JSON.parse(el.getAttribute("data-key-takeaways") ?? "[]"); } catch { return []; } } },
      whoShouldReadThis: { default: "", renderHTML: (attrs) => ({ "data-who-should-read": attrs.whoShouldReadThis ?? "" }), parseHTML: (el) => el.getAttribute("data-who-should-read") ?? "" },
      readingStatus: { default: "want-to-read", renderHTML: (attrs) => ({ "data-reading-status": attrs.readingStatus ?? "want-to-read" }), parseHTML: (el) => el.getAttribute("data-reading-status") ?? "want-to-read" },
      finishedDate: { default: null, renderHTML: (attrs) => ({ "data-finished-date": attrs.finishedDate ?? "" }), parseHTML: (el) => el.getAttribute("data-finished-date") || null },
    };
  },
  parseHTML() { return [{ tag: 'div[data-node="readingBlock"]' }]; },
  renderHTML({ node, HTMLAttributes }) {
    const a = node.attrs;
    return ["div", mergeAttributes(HTMLAttributes, { "data-node": "readingBlock", class: "reading-block" }), ["h3", {}, a.bookTitle || "Untitled"]];
  },
});

const TravelGalleryBlock = Node.create({
  name: "travelGalleryBlock",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      layout: { default: "single", renderHTML: (attrs) => ({ "data-layout": attrs.layout ?? "single" }), parseHTML: (el) => el.getAttribute("data-layout") ?? "single" },
      images: { default: [], renderHTML: (attrs) => ({ "data-images": JSON.stringify(Array.isArray(attrs.images) ? attrs.images : []) }), parseHTML: (el) => { try { return JSON.parse(el.getAttribute("data-images") ?? "[]"); } catch { return []; } } },
    };
  },
  parseHTML() { return [{ tag: 'div[data-node="travelGalleryBlock"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-node": "travelGalleryBlock" })];
  },
});

const extensions = [
  StarterKit,
  Link.configure({ HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
  ImageNode,
  ReadingBlock,
  TravelGalleryBlock,
];

// ── Test cases ───────────────────────────────────────────────────────────────

const tests = [
  {
    name: "plain text",
    json: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello world" }] }] },
  },
  {
    name: "inline image",
    json: {
      type: "doc",
      content: [{
        type: "image",
        attrs: { src: "https://example.com/photo.jpg", alt: "test", title: null, width: "800", height: "600" },
      }],
    },
  },
  {
    name: "ReadingBlock",
    json: {
      type: "doc",
      content: [{
        type: "readingBlock",
        attrs: {
          bookTitle: "The Great Gatsby", author: "F. Scott Fitzgerald", rating: 4,
          bookCover: null, favoriteQuote: "So we beat on", keyTakeaways: ["Wealth", "Time"],
          whoShouldReadThis: "Everyone", readingStatus: "finished", finishedDate: "2024-01-01",
        },
      }],
    },
  },
  {
    name: "TravelGalleryBlock",
    json: {
      type: "doc",
      content: [{
        type: "travelGalleryBlock",
        attrs: {
          layout: "two-up",
          images: [
            { url: "https://example.com/a.jpg", alt: "A", caption: "", width: 800, height: 600, slotIndex: 0 },
            { url: "https://example.com/b.jpg", alt: "B", caption: "", width: 800, height: 600, slotIndex: 1 },
          ],
        },
      }],
    },
  },
];

// ── Run ──────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    const html = generateHTML(test.json, extensions);
    if (!html || html.length === 0) throw new Error("Empty output");
    console.log(`✓ ${test.name} → ${html.slice(0, 80)}...`);
    passed++;
  } catch (err) {
    console.error(`✗ ${test.name} → ${err.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
