# db/schema/

Drizzle table definitions. Lands in Phase 2 (Database & Content Model).

Planned files:
- `posts.ts`        — posts table (uuid pk, title, slug, excerpt, tiptap_json, html_content,
                       cover_image_url, status, seo_title, seo_description, og_image_url,
                       published_at, scheduled_at, created_at, updated_at)
- `categories.ts`   — categories table (uuid pk, name, slug, description, created_at)
- `relations.ts`    — post_categories join table + Drizzle relation definitions
- `sessions.ts`     — admin_sessions table (id, token_hash, created_at, expires_at)
- `index.ts`        — re-exports all tables for a single import surface
