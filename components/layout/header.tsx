import Link from "next/link";

import { Container } from "@/components/shared/container";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

export function Header() {
  return (
    <header className="border-b border-border/70">
      <Container className="flex h-20 items-center justify-between">
        <Link
          href="/"
          className="font-serif text-xl tracking-tight italic"
        >
          {SITE_NAME}
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-foreground/70 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/search"
            className="px-3 text-sm text-foreground/70 transition-colors hover:text-foreground"
          >
            Search
          </Link>
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
