import { auth } from "@lib/auth";
import { slugify } from "@lib/formatters";
import type { LoginSignupResult, SignupCredentials } from "@ty/Auth";

export async function signup(
  credentials: SignupCredentials,
): Promise<LoginSignupResult> {
  const { first_name, last_name, email, phone } = credentials;
  try {
    const response = await auth.api.signUpEmail({
      body: {
        email,
        password: "",
        //   image: image || undefined,
        //   username:
        //     slugify(first_name + "-" + Array.from(last_name)[0]) || undefined,
        name: `${first_name} ${last_name}`,
        //   displayUsername: username || undefined,
      },
      asResponse: true, // returns a real Response so you can forward its Set-Cookie header
    });

    if (response.status > 399) {
      const errorBody = await response.json().catch(() => null);
      return {
        success: false,
        error:
          errorBody?.message ?? `Sign-Up failed (status ${response.status})`,
      };
    }

    const setCookies = response.headers.getSetCookie?.() ?? [];
    return { success: true, setCookies };
  } catch (err: any) {
    return { success: false, error: `Sign-Up failed. ${String(err)}` };
  }
}
