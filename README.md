# Field Notes

A premium personal publishing platform for immersive travel storytelling, structured reading notes, and thoughtful essays.

Inspired by Kinfolk, Medium, and premium travel publications — built for long-form Thai-language content with world-class editorial aesthetics.

---

## Vision

A single-author editorial journal that feels like a beautifully crafted independent publication. The reading experience takes priority over everything else. Typography, whitespace, and photography work together to create a calm, premium environment for long-form writing.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Database | Vercel Postgres |
| ORM | Drizzle ORM |
| Rich Text | TipTap |
| Image CDN | Cloudinary (signed uploads) |
| Validation | Zod |
| Theme | next-themes |
| Package Manager | pnpm |
| Deployment | Vercel |

---

## Architecture

Feature-based, server-first. Server Components handle data fetching; client components are used only where interactivity is required.

```
app/                  → Next.js App Router pages and layouts
components/
  layout/             → Header, Footer (server components)
  shared/             → Reusable UI primitives (Container, ThemeToggle, etc.)
  ui/                 → shadcn/ui primitives (auto-generated)
features/
  posts/              → Post card, cover, types
  categories/         → Topic grid, types
  admin/              → Admin dashboard, editor (upcoming)
db/
  schema/             → Drizzle table definitions (upcoming)
  migrations/         → Auto-generated SQL migrations (upcoming)
  index.ts            → Drizzle client (upcoming)
lib/
  auth/               → Session, password, cookie utilities (upcoming)
  constants.ts        → Site-wide copy and nav links
  fonts.ts            → Next.js font configuration
  format.ts           → Date and reading-time formatters
  placeholder-data.ts → Temporary content (removed in Phase 2)
  utils.ts            → cn() helper
actions/              → Server Actions (upcoming)
hooks/                → Shared client hooks (upcoming)
types/                → Cross-feature shared types (upcoming)
proxy.ts              → Route protection middleware (auth logic upcoming)
```

---

## Phases

| Phase | Description | Status |
|---|---|---|
| **1** | Project init, design system, homepage layout | ✅ Complete |
| **1.5** | Cleanup, auth/DB scaffolding, documentation | ✅ Complete |
| **2** | Vercel Postgres + Drizzle ORM schema | ⏳ Next |
| **3** | Admin authentication (single-author) | 🔜 Planned |
| **4** | Admin dashboard + TipTap rich text editor | 🔜 Planned |
| **5** | Image upload via Cloudinary | 🔜 Planned |
| **6** | Travel, Reading, Essay post types (custom TipTap nodes) | 🔜 Planned |
| **7** | Article reading experience (TOC, reading time, zoom) | 🔜 Planned |
| **8** | SEO, JSON-LD, Open Graph | 🔜 Planned |
| **9** | Full-text search | 🔜 Planned |
| **10** | Scheduled publishing + About page | 🔜 Planned |

---

## Completed Features (Phase 1 + 1.5)

- Next.js 16 App Router scaffold with TypeScript strict mode
- Tailwind CSS v4 with warm editorial color palette (light + dark)
- shadcn/ui component library initialized
- Dark mode via next-themes (warm charcoal — not pure black)
- Fraunces serif headings + Inter sans body (Thai font migration planned: Phase 2)
- Header with site name, navigation, search link, theme toggle
- Footer with nav links and social links
- Reusable `Container`, `SectionHeading`, `PostCard`, `ImagePlaceholder` components
- Homepage with 6 editorial sections:
  - Featured Story (horizontal hero layout)
  - Latest Stories (3-column grid)
  - Travel Stories
  - Reading Notes
  - Explore Topics (category grid)
  - About Preview
- Feature-based folder architecture
- Auth and DB foundation stubs with TODO documentation
- ESLint, TypeScript, and build scripts configured

---

## Development Workflow

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm` or via `~/.npm-global`)

### Install

```bash
pnpm install
```

### Environment

```bash
cp .env.example .env.local
# Fill in the required values (see .env.example for documentation)
```

### Scripts

```bash
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Serve production build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript type checking (no emit)
pnpm db:generate  # Generate Drizzle migrations (Phase 2+)
pnpm db:migrate   # Apply migrations to Vercel Postgres (Phase 2+)
pnpm db:studio    # Open Drizzle Studio (Phase 2+)
```

### Git workflow

```bash
git add .
git commit -m "Phase X — description"
git push origin main
```

---

## Environment Variables

See `.env.example` for the full list. Copy to `.env.local` for local development.

---

## Design Principles

1. **Reading comfort** — always the highest priority
2. **Thai typography quality** — Noto Serif Thai (headings), Noto Sans Thai (body/UI)
3. **Editorial elegance** — quiet luxury, not startup aesthetics
4. **Simplicity** — minimal interface chrome; content is the hero
5. **Performance** — Server Components by default, lazy loading throughout

Dark mode: warm charcoal backgrounds, soft contrast — like reading a beautifully printed magazine at night.
