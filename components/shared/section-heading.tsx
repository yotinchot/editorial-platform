import Link from "next/link";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
}

export function SectionHeading({
  title,
  description,
  href,
  hrefLabel = "View all",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-6 border-b border-border/70 pb-4",
        className,
      )}
    >
      <div>
        <h2 className="font-serif text-2xl italic sm:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="shrink-0 text-sm text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {hrefLabel}
        </Link>
      ) : null}
    </div>
  );
}
