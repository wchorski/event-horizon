import { createAuthClient } from "better-auth/client";
import { emailOTPClient } from "better-auth/client/plugins"
const { DOMAIN_URL } = import.meta.env;
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: DOMAIN_URL,
  plugins: [emailOTPClient()],
});

const signIn = async () => {
  const data = await authClient.signIn.social({
    provider: "microsoft",
    callbackURL: "/dashboard", // The URL to redirect to after the sign in
  });
};
