/**
 * Server-side TipTap → HTML converter.
 *
 * @tiptap/html is a DOM-free implementation designed specifically for
 * server-side HTML generation. Safe to call from Server Components and
 * Server Actions. Never import this from a client component.
 *
 * The extensions list must match the client-side editor so every node/mark
 * type in the stored JSON has a corresponding renderHTML definition.
 */
import { generateHTML } from "@tiptap/html/server";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import type { JSONContent } from "@tiptap/core";

import { ImageNode } from "./editor-image-node";
import { ReadingBlock } from "./tiptap-nodes/reading-block";
import { TravelGalleryBlock } from "./tiptap-nodes/travel-gallery-block";

// Extension list must exactly match the client-side editor so every node and
// mark type in the stored JSON has a corresponding renderHTML definition.
// HTMLAttributes on Link produce the same security attrs (rel, target) that
// the client toolbar writes via isAllowedUri + configure.
const extensions = [
  StarterKit,
  Link.configure({
    HTMLAttributes: {
      rel: "noopener noreferrer",
      target: "_blank",
    },
  }),
  ImageNode,
  ReadingBlock,
  TravelGalleryBlock,
];

/**
 * Convert TipTap ProseMirror JSON to an HTML string.
 *
 * Throws on failure so callers receive the actual error message rather than
 * a generic null. Callers must wrap in try/catch.
 */
export function generatePostHTML(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  return generateHTML(json as JSONContent, extensions);
}
