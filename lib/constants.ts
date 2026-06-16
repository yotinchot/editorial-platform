/**
 * Site-wide constants. Centralized so copy/branding changes don't require
 * hunting through components.
 */
export const SITE_NAME = "Field Notes";
export const SITE_TAGLINE = "Travel stories, reading notes, and a slower way to write.";
export const SITE_DESCRIPTION =
  "A personal editorial journal — immersive travel storytelling, structured reading notes, and occasional essays.";

export const NAV_LINKS = [
  { label: "Travel", href: "/travel" },
  { label: "Reading", href: "/reading" },
  { label: "Life", href: "/life" },
  { label: "About", href: "/about" },
] as const;

export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/",
  twitter: "https://twitter.com/",
  email: "mailto:hello@example.com",
} as const;
