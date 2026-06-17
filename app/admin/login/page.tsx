import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getSessionToken } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign In — Field Notes",
  robots: { index: false, follow: false },
};

/**
 * /admin/login
 *
 * Server Component — handles the already-authenticated redirect and renders
 * the editorial-style login shell. The interactive form lives in LoginForm
 * (Client Component) to support `useActionState`.
 *
 * Design language:
 * - Warm off-white background matching the public site
 * - Serif heading (editorial wordmark) + sans-serif form labels
 * - Generous whitespace, single narrow column
 * - No logo, no branding beyond the site name
 */
export default async function LoginPage() {
  // If the user already has a valid session, send them to the admin dashboard.
  const token = await getSessionToken();
  if (token && (await verifySession(token))) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        {/* ── Wordmark ──────────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl tracking-tight text-foreground">
            Field Notes
          </h1>
          <p className="mt-2 text-sm text-foreground/50">Admin Portal</p>
        </div>

        {/* ── Login form ────────────────────────────────────────────── */}
        <LoginForm />

        {/* ── Footer note ───────────────────────────────────────────── */}
        <p className="mt-8 text-center text-xs text-foreground/30">
          การเข้าสู่ระบบนี้สำหรับผู้ดูแลระบบเท่านั้น
        </p>
      </div>
    </main>
  );
}
