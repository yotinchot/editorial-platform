# actions/

Server Actions, grouped by feature (`posts.ts`, `categories.ts`, `auth.ts`,
`upload.ts`). Lands alongside the database layer in Phase 2+ — this is where
Zod validation wraps every mutation before it touches `db/`.
