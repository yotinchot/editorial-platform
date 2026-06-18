/**
 * Server-only TipTap extension bundle.
 *
 * Import this ONLY from server-side code (lib/html.ts, Server Actions,
 * Server Components). Never import from "use client" files — doing so would
 * make these modules shared between client and server bundles, which triggers
 * React RSC proxy errors when generateHTML runs inside a Server Action.
 */
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";

import { ImageNode } from "../editor-image-node";
import { ReadingBlock } from "./reading-block";
import { TravelGalleryBlock } from "./travel-gallery-block";

export const serverExtensions = [
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
