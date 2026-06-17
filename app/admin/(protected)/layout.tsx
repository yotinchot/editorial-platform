import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionToken } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { logoutAction } from "./actions";

/**
 * Protected admin layout — the actual security gate.
 *
 * This is a Server Component that runs on every request to any route under
 * app/admin/(protected)/*. It performs a full session verification:
 *
 *   1. Read the session cookie.
 *   2. Hash the raw token.
 *   3. Query admin_sessions WHERE token_hash = hash.
 *   4. Check that expires_at > now().
 *
 * If any step fails, the user is redirected to /admin/login immediately,
 * before any child component renders.
 *
 * Relationship to proxy.ts middleware
 * ─────────────────────────────────────
 * The middleware (proxy.ts) is a fast first pass that redirects cookie-less
 * requests before they reach Next.js. This layout is the authoritative
 * second pass that validates the cookie's actual value against the DB.
 * Both layers must be present for defence-in-depth.
 *
 * Admin shell
 * ───────────
 * For Phase 3 this renders a minimal shell: a top bar with the site name
 * and a logout button. A full admin navigation is built in Phase 5.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Auth check ──────────────────────────────────────────────────────────
  const token = await getSessionToken();

  if (!token || !(await verifySession(token))) {
    redirect("/admin/login");
  }

  // ── Render admin shell ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-serif text-lg text-foreground">
              Field Notes
            </span>
            <nav className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-sm text-foreground/50 transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/posts"
                className="text-sm text-foreground/50 transition-colors hover:text-foreground"
              >
                Posts
              </Link>
            </nav>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-foreground/50 transition-colors hover:text-foreground"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
