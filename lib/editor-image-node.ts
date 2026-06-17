/**
 * TipTap Image node extended with `width` and `height` attributes.
 *
 * The standard @tiptap/extension-image only supports src, alt, title.
 * Storing intrinsic dimensions prevents CLS on public reading pages and
 * lets the browser reserve space before the image loads.
 *
 * Import this in BOTH the client editor (tiptap-editor.tsx) AND the
 * server-side HTML generator (lib/html.ts) so the two serialize/parse
 * image nodes identically.
 *
 * Safe in both browser and Node.js contexts — no DOM or window references.
 */
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
    };
  },
});
