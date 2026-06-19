"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Placeholder } from "@tiptap/extension-placeholder";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import type { JSONContent } from "@tiptap/react";

import {
  ImageNode,
  ReadingBlock,
  TravelGalleryBlock,
} from "@/lib/tiptap-nodes/client-extensions";
import type { EditorialImage } from "@/types/image";

import { EditorToolbar } from "./editor-toolbar";

interface TipTapEditorProps {
  initialContent: JSONContent | null;
  onChange: (json: JSONContent) => void;
  /** Called by the inline image toolbar button. Handles compression + upload. */
  onImageUpload: (file: File) => Promise<EditorialImage>;
}

/**
 * TipTap rich-text editor with StarterKit, Link, and Placeholder.
 *
 * Exported as the default export so it can be loaded with:
 *   dynamic(() => import("@/components/editor/tiptap-editor"), { ssr: false })
 *
 * `immediatelyRender: false` prevents hydration mismatches in SSR/RSC contexts.
 *
 * CSS for the placeholder and editor prose typography lives in globals.css
 * under the `.editor-prose` and `.tiptap` selectors.
 */
export default function TipTapEditor({
  initialContent,
  onChange,
  onImageUpload,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        // Block javascript: and other unsafe protocols at the extension level.
        // Only allow http(s), mailto, relative paths, and fragment links.
        isAllowedUri: (url) => {
          try {
            const parsed = new URL(url, window.location.href);
            return ["https:", "http:", "mailto:"].includes(parsed.protocol);
          } catch {
            // URL constructor throws on relative paths — allow / and # prefixes.
            return url.startsWith("/") || url.startsWith("#");
          }
        },
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
          class:
            "underline underline-offset-2 text-accent hover:opacity-80 transition-opacity",
        },
      }),
      // ImageNode, ReadingBlock, TravelGalleryBlock come from client-extensions.ts
      // which defines them inline — no shared module with lib/html.ts (server).
      ImageNode,
      ReadingBlock,
      TravelGalleryBlock,
      Placeholder.configure({
        placeholder: "Start writing your story…",
      }),
    ],
    content: initialContent ?? undefined,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "editor-prose outline-none",
      },
    },
  });

  // Destroy the editor instance when the component unmounts.
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  // Apply Thai-font class to h2/h3 nodes that contain Thai characters.
  // Mirrors the server-side processArticleHeadings() logic so the editor
  // preview matches the public reading page.
  useEffect(() => {
    if (!editor) return;

    const applyHeadingFonts = () => {
      const dom = editor.view.dom;
      dom.querySelectorAll("h2, h3").forEach((el) => {
        if (/[฀-๿]/.test(el.textContent ?? "")) {
          el.classList.add("heading-thai");
        } else {
          el.classList.remove("heading-thai");
        }
      });
    };

    applyHeadingFonts();
    editor.on("update", applyHeadingFonts);
    return () => {
      editor.off("update", applyHeadingFonts);
    };
  }, [editor]);

  return (
    <div className="rounded-sm border border-border focus-within:ring-2 focus-within:ring-ring/50">
      <EditorToolbar editor={editor} onImageUpload={onImageUpload} />
      <div className="px-5 py-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
