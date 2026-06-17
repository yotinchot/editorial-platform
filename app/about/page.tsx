import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/shared/container";
import { ImagePlaceholder } from "@/components/shared/image-placeholder";
import { canonicalUrl } from "@/lib/metadata";

const ABOUT_DESCRIPTION =
  "A personal record of places visited, books finished, and ideas worth sitting with.";

export const metadata: Metadata = {
  title: "About",
  description: ABOUT_DESCRIPTION,
  alternates: { canonical: canonicalUrl("/about") },
  openGraph: {
    title: "About",
    description: ABOUT_DESCRIPTION,
    url: canonicalUrl("/about"),
  },
};

export default function AboutPage() {
  return (
    <Container className="py-14 sm:py-20">
      <div className="grid gap-12 sm:grid-cols-[200px_1fr] sm:gap-16">
        {/* Portrait */}
        <div>
          <ImagePlaceholder className="aspect-square max-w-[200px]" />
        </div>

        {/* Bio */}
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            About
          </p>
          <h1 className="mt-3 font-serif text-4xl italic leading-tight sm:text-5xl">
            Writing slowly, on purpose.
          </h1>

          <div className="mt-8 space-y-5 text-muted-foreground leading-relaxed">
            <p>
              This site is a personal record — places visited carefully, books
              finished and actually thought about, and the occasional idea that
              deserved more than a scroll.
            </p>
            <p>
              Writing here is for thinking, not for publishing on a schedule.
              No bylines, no contributors, no algorithm to satisfy. Just one
              person writing at the pace they actually think.
            </p>
            <p>
              If something here is useful or interesting, that is a bonus. If
              you disagree with something, the door is open.
            </p>
          </div>

          {/* Navigation links */}
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/travel"
              className="text-sm underline underline-offset-4 hover:text-accent transition-colors"
            >
              Travel Stories
            </Link>
            <Link
              href="/reading"
              className="text-sm underline underline-offset-4 hover:text-accent transition-colors"
            >
              Reading Notes
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
