import { auth } from "@lib/auth";
import type { LoginSignupResult } from "@ty/Auth";

export async function signout(headers: Headers,): Promise<LoginSignupResult> {
  try {
    const response = await auth.api.signOut({
      // This endpoint requires session cookies.
      headers: headers,
      asResponse: true,
    });

    if (response.status > 399) {
      const errorBody = await response.json().catch(() => null);
      return {
        success: false,
        error:
          errorBody?.message ?? `Sign-Out failed (status ${response.status})`,
      };
    }

    const setCookies = response.headers.getSetCookie?.() ?? [];
    return { success: true, setCookies };
  } catch (err: any) {
    return { success: false, error: `Sign-Out failed. ${String(err)}` };
  }
}
