import { containsThai } from "./thai-font";

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Extracts H2/H3 headings from content_html for table of contents rendering.
 * IDs are assigned by sequential counter — must match `processArticleHeadings` order.
 */
export function extractToc(contentHtml: string | null): TocEntry[] {
  if (!contentHtml) return [];
  const matches = [...contentHtml.matchAll(/<h([23])[^>]*>(.*?)<\/h[23]>/gi)];
  return matches.map((m, i) => ({
    id: `h-${i}`,
    text: m[2].replace(/<[^>]+>/g, ""),
    level: parseInt(m[1]) as 2 | 3,
  }));
}

/**
 * Adds sequential id attributes and Thai-font classes to H2/H3 tags.
 *
 * - id="h-N" — sequential anchor for TOC links (must match extractToc order).
 * - class="heading-thai" — signals CSS to use Noto Serif Thai for the entire
 *   heading, including numerals and punctuation, when Thai text is present.
 *   Pure Latin headings receive no class and default to Cormorant Garamond.
 */
export function processArticleHeadings(html: string): string {
  let counter = 0;
  return html.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (_, tag, attrs: string, content: string) => {
      const id = `h-${counter++}`;
      const text = content.replace(/<[^>]+>/g, "");
      const fontClass = containsThai(text) ? " heading-thai" : "";
      return `<${tag}${attrs} id="${id}"${fontClass ? ` class="${fontClass}"` : ""}>${content}</${tag}>`;
    },
  );
}

/** @deprecated Use processArticleHeadings — adds IDs and Thai font class. */
export function injectHeadingIds(html: string): string {
  return processArticleHeadings(html);
}
