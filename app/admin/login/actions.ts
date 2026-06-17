"use server";

import { redirect } from "next/navigation";

import { verifyAdminPassword } from "@/lib/auth/password";
import { generateToken, createSession } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";

/**
 * State shape returned by loginAction.
 * `error` is undefined on success (redirect happens before return).
 */
export type LoginActionState = {
  error?: string;
};

/**
 * Server Action — handles the admin login form submission.
 *
 * Flow:
 * 1. Extract and validate the password field from FormData.
 * 2. Compare against ADMIN_PASSWORD using timingSafeEqual (via password.ts).
 * 3. On success: generate a token, persist the hash to admin_sessions,
 *    set the HttpOnly cookie, then redirect to /admin.
 * 4. On failure: return a user-facing error message (no redirect).
 *
 * Security notes:
 * - This function only runs on the server — the password never touches client code.
 * - `redirect()` throws internally; returning after it is unreachable but
 *   TypeScript requires the Promise<LoginActionState> return type.
 * - Error messages are intentionally generic to avoid leaking whether the
 *   account exists, the password length, etc.
 */
export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const password = formData.get("password");

  // Guard: field must be a non-empty string.
  if (typeof password !== "string" || password.trim() === "") {
    return { error: "กรุณากรอกรหัสผ่าน" };
  }

  let passwordValid: boolean;

  try {
    passwordValid = verifyAdminPassword(password);
  } catch {
    // ADMIN_PASSWORD env var not set — surface a clear server misconfiguration
    // message rather than a generic auth error.
    return { error: "ระบบ: ADMIN_PASSWORD ยังไม่ได้ตั้งค่า" };
  }

  if (!passwordValid) {
    // Intentionally vague — don't confirm whether the account exists.
    return { error: "รหัสผ่านไม่ถูกต้อง" };
  }

  // Password correct — create session and set cookie.
  const token = generateToken();
  await createSession(token);
  await setSessionCookie(token);

  // redirect() throws a Next.js-internal error to halt execution and trigger
  // the redirect. It never returns, so this function signature is satisfied.
  redirect("/admin");
}
