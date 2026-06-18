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
import type { JSONContent } from "@tiptap/react";

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
 * Returns null when generation fails so the caller can decide whether to
 * abort the save or warn the user. Never silently stores empty HTML.
 */
export function generatePostHTML(json: unknown): string | null {
  if (!json || typeof json !== "object") return "";
  try {
    return generateHTML(json as JSONContent, extensions);
  } catch (err) {
    console.error("[generatePostHTML] Failed to generate HTML from TipTap JSON:", err);
    return null;
  }
}
