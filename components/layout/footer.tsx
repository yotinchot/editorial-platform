import Link from "next/link";

import { Container } from "@/components/shared/container";
import { NAV_LINKS, SITE_NAME, SITE_TAGLINE, SOCIAL_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/70">
      <Container className="flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm space-y-2">
          <p className="font-serif text-lg italic">{SITE_NAME}</p>
          <p className="text-sm text-muted-foreground">{SITE_TAGLINE}</p>
        </div>

        <nav className="flex gap-6 text-sm text-foreground/70">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex gap-6 text-sm text-foreground/70">
          <a href={SOCIAL_LINKS.instagram} className="transition-colors hover:text-foreground">
            Instagram
          </a>
          <a href={SOCIAL_LINKS.twitter} className="transition-colors hover:text-foreground">
            Twitter
          </a>
          <a href={SOCIAL_LINKS.email} className="transition-colors hover:text-foreground">
            Email
          </a>
        </div>
      </Container>

      <Container className="border-t border-border/50 py-6">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
