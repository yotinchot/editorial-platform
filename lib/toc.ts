export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Extracts H2/H3 headings from content_html for table of contents rendering.
 * IDs are assigned by sequential counter — must match injectHeadingIds order.
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
 * Adds sequential id attributes to H2/H3 tags in HTML string.
 * Counter matches extractToc so TOC anchor links resolve correctly.
 */
export function injectHeadingIds(html: string): string {
  let i = 0;
  return html.replace(/<(h[23])([^>]*)>/gi, (_, tag, attrs: string) => {
    return `<${tag}${attrs} id="h-${i++}">`;
  });
}
