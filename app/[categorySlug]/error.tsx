"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Container } from "@/components/shared/container";

export default function CategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center justify-center py-32 text-center">
      <h1 className="font-serif text-3xl italic">Unable to load category</h1>
      <p className="mt-3 text-muted-foreground">
        Something went wrong while loading this section.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="text-sm underline underline-offset-4 hover:text-muted-foreground transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-sm underline underline-offset-4 hover:text-muted-foreground transition-colors"
        >
          Back to home
        </Link>
      </div>
    </Container>
  );
}
