/**
 * TipTap Image node extended with width, height, fitMode, and focal point attributes.
 *
 * Import this in the server-side HTML generator (lib/html.ts / server-extensions.ts).
 * The client editor uses client-extensions.ts which mirrors the schema but adds a NodeView.
 *
 * Safe in both browser and Node.js contexts — no DOM or window references.
 */
import { mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";

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

  renderHTML({ node, HTMLAttributes }) {
    const { fitMode = "natural", focalX = 0.5, focalY = 0.5 } = node.attrs as {
      fitMode?: string;
      focalX?: number;
      focalY?: number;
    };

    const extra: Record<string, string> = { class: "article-image" };

    if (fitMode === "cover" || fitMode === "contain") {
      extra["data-fit-mode"] = fitMode;
      extra.style = `object-fit:${fitMode};object-position:${Number(focalX) * 100}% ${Number(focalY) * 100}%;`;
    }

    return ["img", mergeAttributes(HTMLAttributes, extra)];
  },
});
