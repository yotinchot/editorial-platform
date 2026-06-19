import { processArticleHeadings } from "@/lib/toc";

interface ArticleContentProps {
  html: string;
}

/**
 * Renders sanitised TipTap-generated HTML for public reading.
 * Heading IDs are injected for TOC anchor links.
 * Content is generated server-side by our own serialiser — no user-supplied HTML.
 */
export function ArticleContent({ html }: ArticleContentProps) {
  const processed = processArticleHeadings(html);
  return (
    <div
      className="article-prose"
      dangerouslySetInnerHTML={{ __html: processed }}
    />
  );
}
