"use client";

import { useActionState } from "react";

import { loginAction, type LoginActionState } from "./actions";

const initialState: LoginActionState = {};

/**
 * LoginForm — interactive part of the login page.
 *
 * Uses React 19 `useActionState` so the pending state and error response
 * are managed declaratively without a separate `useState` + `fetch` pattern.
 *
 * This is a Client Component only because `useActionState` is a client hook.
 * All actual auth logic lives in the Server Action (actions.ts).
 */
export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="w-full space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground/70"
        >
          รหัสผ่าน
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          disabled={isPending}
          className="w-full rounded-sm border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50 transition-opacity"
          placeholder="••••••••••••"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-sm bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        {isPending ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
