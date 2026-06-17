import type { Metadata } from "next";

import { Container } from "@/components/shared/container";
import { PostCard } from "@/features/posts/components/post-card";
import { searchPosts } from "@/lib/data/search";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: false },
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await searchPosts(query) : [];

  return (
    <Container className="py-14 sm:py-20">
      {/* Search form */}
      <form method="GET" action="/search" className="mb-12 max-w-xl">
        <label
          htmlFor="q"
          className="mb-2 block text-xs font-semibold tracking-widest text-muted-foreground uppercase"
        >
          Search
        </label>
        <div className="flex gap-3">
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="ค้นหาบทความ, หนังสือ, หมวดหมู่…"
            autoFocus={!query}
            className="flex-1 rounded-sm border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="rounded-sm bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      {query ? (
        results.length > 0 ? (
          <>
            <p className="mb-8 text-sm text-muted-foreground">
              {results.length} {results.length === 1 ? "result" : "results"} for{" "}
              <span className="font-medium text-foreground">{query}</span>
            </p>
            <div className="grid gap-10 sm:grid-cols-3">
              {results.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">
              No results for{" "}
              <span className="font-medium text-foreground">{query}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different keyword or browse by category.
            </p>
          </div>
        )
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Enter a keyword above to search.
        </p>
      )}
    </Container>
  );
}
