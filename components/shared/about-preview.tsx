import Link from "next/link";

import { ImagePlaceholder } from "@/components/shared/image-placeholder";

export function AboutPreview() {
  return (
    <div className="grid items-center gap-10 sm:grid-cols-[200px_1fr]">
      <ImagePlaceholder className="aspect-square" />
      <div>
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          About
        </p>
        <h2 className="mt-2 font-serif text-2xl italic sm:text-3xl">
          Writing slowly, on purpose.
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          This is a personal record of places visited, books finished, and
          the occasional idea worth sitting with longer than a scroll
          allows. No bylines, no contributors — just one person writing at
          the pace they actually think.
        </p>
        <Link
          href="/about"
          className="mt-4 inline-block text-sm underline-offset-4 hover:underline"
        >
          Read the full story →
        </Link>
      </div>
    </div>
  );
}
