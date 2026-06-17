import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Field Notes",
  robots: { index: false, follow: false },
};

/**
 * /admin — Admin dashboard.
 *
 * Phase 3 placeholder. Full dashboard UI with post management,
 * analytics, and quick-actions is built in Phase 5.
 */
export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-foreground">Dashboard</h2>
        <p className="mt-1 text-sm text-foreground/50">
          Phase 5 — Full admin UI coming soon.
        </p>
      </div>

      <div className="rounded-sm border border-border p-6 text-sm text-foreground/60">
        Authentication is working. You are signed in as the site administrator.
      </div>
    </div>
  );
}
