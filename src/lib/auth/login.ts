// lib/auth/login.ts
import { auth } from "@lib/auth";
import { FormError } from "@lib/form-action";
import type { LoginCredentials } from "@lib/validate";
import type { AuthCookies } from "./signup";

export type LoginResult =
  | (AuthCookies & { kind: "ok" })
  | { kind: "needs-verification"; email: string };

type AuthErrorBody = { message?: string; code?: string };

export async function login({ email, password }: LoginCredentials): Promise<LoginResult> {
  const response = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as AuthErrorBody | null;

    // sendOnSignIn: true already emailed a fresh code, so don't send another
    if (body?.code === "EMAIL_NOT_VERIFIED") return { kind: "needs-verification", email };

    if (body?.code === "INVALID_EMAIL_OR_PASSWORD" || response.status === 401) {
      // Deliberately not attached to a field: don't reveal which one was wrong
      throw new FormError("Invalid email or password.", 401);
    }
    throw new FormError(body?.message ?? "Login failed.", response.status);
  }

  return { kind: "ok", setCookies: response.headers.getSetCookie() };
}