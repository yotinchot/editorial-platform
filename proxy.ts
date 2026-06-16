import { NextResponse } from "next/server";

/**
 * Placeholder — admin route protection lands in the Authentication phase.
 * Wiring it up now (matcher scoped to /admin) so the convention is in
 * place before session-cookie logic is added.
 *
 * Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`, with a
 * matching `proxy` export name.
 */
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
