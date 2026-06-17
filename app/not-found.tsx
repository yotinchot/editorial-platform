import Link from "next/link";

import { Container } from "@/components/shared/container";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center justify-center py-32 text-center">
      <p className="font-serif text-8xl italic text-muted-foreground/30">404</p>
      <h1 className="mt-6 font-serif text-3xl italic">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 text-sm underline underline-offset-4 hover:text-muted-foreground transition-colors"
      >
        Back to home
      </Link>
    </Container>
  );
}
