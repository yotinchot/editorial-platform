import { Fragment } from "react";
import { containsThai } from "@/lib/thai-font";

// Splits on digit sequences (with optional comma/dot separators and trailing %).
// Using a capture group in split() includes the matched digits in the result array.
const DIGIT_SPLIT_RE = /(\d+(?:[,.]\d+)*%?)/;
const IS_DIGIT_RE = /^\d+(?:[,.]\d+)*%?$/;

/**
 * Renders heading text with digit sequences scaled down inside Thai headings.
 *
 * Root cause: Noto Serif Thai's Latin digit glyphs (U+0-FF subset) have a
 * cap-height of ~72% of font-size, while Thai glyphs sit at ~56%. At large
 * display sizes this makes digits appear visually taller than surrounding Thai
 * text. Wrapping digits in .thai-heading-number (font-size: 0.78em) closes
 * the gap without changing the stored content or affecting SEO.
 *
 * Pure English headings are returned unchanged.
 */
export function ThaiHeadingText({ children }: { children: string }) {
  if (!containsThai(children)) {
    return <>{children}</>;
  }

  const parts = children.split(DIGIT_SPLIT_RE);

  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {IS_DIGIT_RE.test(part) ? (
            <span className="thai-heading-number">{part}</span>
          ) : (
            part
          )}
        </Fragment>
      ))}
    </>
  );
}
