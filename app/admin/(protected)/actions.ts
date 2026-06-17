"use server";

import { redirect } from "next/navigation";

import { getSessionToken, clearSessionCookie } from "@/lib/auth/cookies";
import { destroySession } from "@/lib/auth/session";

/**
 * Logout — destroys the server-side session and clears the cookie.
 *
 * Order of operations matters:
 * 1. Read the token from the cookie before clearing it.
 * 2. Delete the admin_sessions row (server-side revocation).
 * 3. Clear the cookie (client-side revocation).
 * 4. Redirect to /admin/login.
 *
 * Deleting the DB row first ensures that even if the cookie clear fails
 * (e.g. redirect throws before it completes), the token is already invalid
 * on the server. The cookie will simply become a useless orphan.
 */
export async function logoutAction(): Promise<never> {
  const token = await getSessionToken();

  if (token) {
    // Revoke server-side first — the token is dead even if the cookie lingers.
    await destroySession(token);
  }

  // Clear the HttpOnly cookie from the browser.
  await clearSessionCookie();

  redirect("/admin/login");
}
