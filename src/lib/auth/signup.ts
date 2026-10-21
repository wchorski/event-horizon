// lib/auth/signup.ts
import { auth } from "@lib/auth";
import { slugify } from "@lib/formatters";
import { FormError } from "@lib/form-action";
import type { SignupCredentials } from "@lib/validate";

export type AuthCookies = { setCookies: string[] };
export type SignupResult = AuthCookies & {
  email: string;
};


type AuthErrorBody = { message?: string; code?: string };

const makeUsername = (first: string, last: string) => {
  const base = slugify(`${first}_${[...last][0] ?? ""}`).replaceAll("-", "_");
  return base ? `${base}_${crypto.randomUUID().slice(0, 4)}` : undefined;
};

export async function signup(
  credentials: SignupCredentials,
): Promise<SignupResult> {
  const { first_name, last_name, email, password, image } = credentials;

  const response = await auth.api.signUpEmail({
    body: {
      email,
      password,
      image,
      username: makeUsername(first_name, last_name),
      name: `${first_name} ${last_name}`,
      first_name,
      last_name,
    },
    asResponse: true, // real Response, so we can forward Set-Cookie
  });

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as AuthErrorBody | null;
    //? This will never trigger because of of "enumeration" security
    // this is handled with auth.ts -> `onExistingUserSignUp`
    throw new FormError(
      body?.message ?? "Sign-up failed",
      response.status,
      body?.code?.startsWith("USER_ALREADY_EXISTS") ? "email" : undefined,
    );
  }

  // Account exists at this point, so a failed OTP must not turn into an error.
  // let otpSent = false;
  // try {
  //   const verify = await auth.api.sendVerificationOTP({
  //     body: { email, type: "email-verification" },
  //   });
  //   otpSent = verify.success;
  // } catch (err) {
  //   console.error("sendVerificationOTP failed", err);
  // }

  return {
    setCookies: response.headers.getSetCookie(),
    // otpSent,
    email,
    // type: "email-verification",
  };
}
