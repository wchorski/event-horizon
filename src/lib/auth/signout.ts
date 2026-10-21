import { auth } from "@lib/auth";
import type { AuthCookies } from "./signup";

export async function signout(headers: Headers): Promise<AuthCookies> {
  const response = await auth.api.signOut({ headers, asResponse: true });

  if (!response.ok) {
    console.error("signOut failed", response.status);
    throw new Error("Sign-out failed");
  }

  // These are the Set-Cookie headers that *clear* the session cookie
  return { setCookies: response.headers.getSetCookie() };
}
