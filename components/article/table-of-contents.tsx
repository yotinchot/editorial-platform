import { cn } from "@/lib/utils";
import type { TocEntry } from "@/lib/toc";

export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  if (entries.length < 2) return null;

  return (
    <nav aria-label="Table of contents">
      <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        In this article
      </p>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className={cn(
                "block text-sm text-muted-foreground transition-colors hover:text-foreground",
                entry.level === 3 && "pl-4",
              )}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
