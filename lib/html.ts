/**
 * Server-side TipTap → HTML converter.
 *
 * Uses server-extensions.ts which imports only from server-safe node files.
 * None of those files are imported by "use client" editor components, which
 * prevents React RSC proxy errors inside Server Actions.
 */
import { generateHTML } from "@tiptap/html/server";
import type { JSONContent } from "@tiptap/core";

import { serverExtensions } from "./tiptap-nodes/server-extensions";

/**
 * Convert TipTap ProseMirror JSON to an HTML string.
 *
 * Throws on failure so callers receive the actual error message rather than
 * a generic null. Callers must wrap in try/catch.
 */
export function generatePostHTML(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  return generateHTML(json as JSONContent, serverExtensions);
}
