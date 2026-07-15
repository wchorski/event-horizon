// src/lib/login.ts
import { auth } from "@lib/auth";
import type { LoginCredentials, LoginResult } from "@ty/Auth";

export async function login(
  credentials: LoginCredentials
): Promise<LoginResult> {
  const { email, password } = credentials;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  try {
    const response = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,  // returns a real Response so you can forward its Set-Cookie header
    });

    if (response.status > 399) {
      const errorBody = await response.json().catch(() => null);
      return {
        success: false,
        error: errorBody?.message ?? `Login failed (status ${response.status})`,
      };
    }

    const setCookies = response.headers.getSetCookie?.() ?? [];
    return { success: true, setCookies };
  } catch (err: any) {
    return { success: false, error: `Login failed. ${String(err)}` };
  }
}