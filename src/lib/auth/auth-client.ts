import { createAuthClient } from "better-auth/client";
const { DOMAIN_URL } = import.meta.env;
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: DOMAIN_URL,
});
