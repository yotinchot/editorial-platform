import Link from "next/link";

import type { CategorySummary } from "@/features/categories/types/category";

export function TopicGrid({ categories }: { categories: CategorySummary[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/${category.slug}`}
          className="group rounded-lg border border-border/70 p-5 transition-colors hover:border-accent/60 hover:bg-accent/5"
        >
          <p className="font-serif text-lg italic transition-colors group-hover:text-accent">
            {category.name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {category.description}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {category.postCount} stories
          </p>
        </Link>
      ))}
    </div>
  );
}
