import { auth } from "@lib/auth";
import { randomBytes } from "crypto";
import { slugify } from "@lib/formatters";
import type {
  CreatedUser,
  CreateUserResult,
  LoginSignupResult,
  SignupCredentials,
} from "@ty/Auth";

export async function createUser(
  credentials: SignupCredentials,
): Promise<CreateUserResult> {
  const { first_name, last_name, email, phone } = credentials;
  const password = randomBytes(32).toString("hex");
  const username = first_name + "_" + Array.from(last_name)[0];

  try {
    const res = await auth.api.createUser({
      body: {
        email,
        name: `${first_name} ${last_name}`,
        password,
        //   image: image || undefined,
        role: "user",
        data: {
          username,
          first_name,
          last_name,
          phone,
        },
        //   displayUsername: username || undefined,
      },
      asResponse: true, // returns a real Response so you can forward its Set-Cookie header
    });

    if (res.status > 399) {
      const errorBody = await res.json().catch(() => null);
      return {
        success: false,
        error:
          errorBody?.message ?? `Create User failed (status ${res.status})`,
      };
    }

    const { user } = (await res.json()) as { user: CreatedUser };

    // const setCookies = response.headers.getSetCookie?.() ?? [];
    return {
      success: true,
      user,
    };
  } catch (err: any) {
    return { success: false, error: `Create User failed. ${String(err)}` };
  }
}
