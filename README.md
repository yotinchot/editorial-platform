# Field Notes

A single-author editorial platform for immersive travel storytelling, structured reading notes, and thoughtful essays. Inspired by Kinfolk, Medium, and premium travel publications — built for long-form Thai-language content.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Database | Vercel Postgres (postgres.js + Drizzle ORM) |
| Rich Text | TipTap |
| Image CDN | Cloudinary (signed uploads only) |
| Validation | Zod |
| Theme | next-themes |
| Package Manager | pnpm |
| Deployment | Vercel |

---

## Architecture

Server-first, feature-based. Server Components handle data fetching; client components are used only where interactivity is required.

```
app/                  → Next.js App Router (pages, layouts, error/not-found boundaries)
  [categorySlug]/     → Public category listing
  [categorySlug]/[postSlug]/ → Public post page (SEO, JSON-LD, TOC, reading time)
  about/              → About page
  search/             → Full-text search (PostgreSQL ILIKE)
  sitemap.ts          → Auto-generated XML sitemap
  robots.ts           → robots.txt
  admin/              → Admin panel (protected by HttpOnly session cookie)
    login/            → Login form + server action
    (protected)/      → Dashboard, post list, post editor

components/
  layout/             → Header, Footer
  shared/             → Container, ThemeProvider, ThemeToggle
  article/            → ArticleContent (prose), TableOfContents
  ui/                 → shadcn/ui primitives

features/
  posts/              → PostCard, PostCover, PostSummary type, PostDetail type
  categories/         → TopicGrid

db/
  schema/             → Drizzle table definitions (posts, categories, post_categories, admin_sessions)
  migrations/         → Committed SQL migration files
  client.ts           → postgres.js + Drizzle client (server-only)

lib/
  auth/               → session.ts, password.ts, cookies.ts
  data/               → posts.ts, categories.ts, search.ts (DB queries)
  metadata.ts         → SEO utilities: canonicalUrl(), ogImages(), SITE_URL, SITE_AUTHOR
  reserved-slugs.ts   → Blocks reserved routes (admin, about, search, api…) from category slugs
  reading-time.ts     → Thai-aware hybrid heuristic (Thai chars ÷ 5 + non-Thai tokens)
  constants.ts        → Site-wide copy and nav links
  format.ts           → Date and reading-time formatters
  toc.ts              → HTML → TOC entry extractor

actions/
  posts.ts            → createPost, updatePost, publishPost, deletePost
  categories.ts       → createCategory, updateCategory, deleteCategory
  images.ts           → Server-side Cloudinary signature generation (API_SECRET never leaves server)

scripts/
  seed.ts             → Development seed (idempotent — safe to re-run)
```

---

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm

### Install

```bash
pnpm install
```

### Environment

```bash
cp .env.example .env.local
# Fill in the required values — see .env.example for documentation
```

Required variables:

| Variable | Purpose |
|---|---|
| `POSTGRES_URL` | Pooled connection string (runtime queries) |
| `POSTGRES_URL_NON_POOLING` | Direct connection string (DDL migrations) |
| `NEXT_PUBLIC_SITE_URL` | Production URL, no trailing slash |
| `NEXT_PUBLIC_AUTHOR_NAME` | Author name for JSON-LD and OG metadata |
| `ADMIN_PASSWORD` | Plain-text password (hashed in DB on first login) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (server-only, never sent to client) |

### Database

```bash
pnpm db:migrate   # Apply pending SQL migrations to Postgres
pnpm db:seed      # Seed development data (idempotent)
pnpm db:studio    # Open Drizzle Studio in browser
pnpm db:generate  # Generate new migration after schema changes
```

### Scripts

```bash
pnpm dev          # Development server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Serve production build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript type checking (no emit)
```

---

## Deployment (Vercel)

1. Create a Vercel Postgres database in the Vercel dashboard.
2. Add all required environment variables to Vercel project settings.
3. Run `pnpm db:migrate` locally against the production database (requires `POSTGRES_URL_NON_POOLING`).
4. Push to `main` — Vercel auto-deploys.

ISR is configured at `revalidate = 3600` (1 hour) on all public pages. Revalidation also triggers on publish/save via `revalidatePath`.

---

## Security Notes

- Admin password is compared with `timingSafeEqual` (timing-attack resistant).
- Session tokens are stored as SHA-256 hashes in the DB — raw token lives only in the HttpOnly cookie.
- Cloudinary uploads are signed server-side; `CLOUDINARY_API_SECRET` is never sent to the client.
- Category slugs are validated against a reserved-slug list to prevent route collisions with app paths.

---

## Design Principles

1. **Reading comfort** — always the highest priority
2. **Thai typography quality** — Noto Serif Thai (headings), Noto Sans Thai (body/UI)
3. **Editorial elegance** — quiet luxury, not startup aesthetics
4. **Performance** — Server Components by default; card queries exclude large HTML columns
