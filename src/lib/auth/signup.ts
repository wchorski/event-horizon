// lib/auth/signup.ts
import { auth } from "@lib/auth";
import { makeUsername, slugify } from "@lib/formatters";
import { FormError } from "@lib/useForm";
import type { SignupCredentials } from "@lib/validate";

export type AuthCookies = { setCookies: string[] };
export type SignupResult = AuthCookies & {
  userId: string;
  email: string;
};


type AuthErrorBody = { message?: string; code?: string };

export async function signup(
  credentials: SignupCredentials,
): Promise<SignupResult> {
  const { firstName, lastName, email, password, image } = credentials;

  const response = await auth.api.signUpEmail({
    body: {
      email,
      password,
      image,
      username: makeUsername(firstName, lastName),
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
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

  const { user } = await response.clone().json();

  return {
    // otpSent,
    userId: user.id,
    email,
    setCookies: response.headers.getSetCookie(),
    // type: "email-verification",
  };
}
