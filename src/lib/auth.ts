// src/lib/auth.ts
const {
  DOMAIN_URL,
  SITE_TITLE,
  BETTER_AUTH_URL,
  BETTER_AUTH_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET,
} = process.env;

import { passkey } from "@better-auth/passkey";
import { db } from "@db/db";
import * as schema from "@db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username } from "better-auth/plugins";

const isProd = process.env.NODE_ENV === "production";

const socialProviders: Record<
  string,
  { clientId: string; clientSecret: string }
> = {};
if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET)
  socialProviders.github = {
    clientId: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
  };
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET)
  socialProviders.google = {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
  };
if (FACEBOOK_CLIENT_ID && FACEBOOK_CLIENT_SECRET)
  socialProviders.facebook = {
    clientId: FACEBOOK_CLIENT_ID,
    clientSecret: FACEBOOK_CLIENT_SECRET,
  };

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.User,
      session: schema.Session,
      account: schema.Account,
      verification: schema.Verification,
        passkey: schema.Passkey,
    },
  }),
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    // TODO later enable this
    requireEmailVerification: false,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  socialProviders,
  session: {
    cookieCache: { enabled: true, maxAge: 60 * 5 },
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    admin({ defaultRole: "user", adminRoles: ["admin"] }),
    passkey({
      rpID: isProd ? DOMAIN_URL : "localhost",
      rpName: SITE_TITLE,
      origin: BETTER_AUTH_URL,
    }),
    username({ minUsernameLength: 3, maxUsernameLength: 30 }),
  ],
  advanced: {
    cookiePrefix: "eh",
    useSecureCookies: isProd, 
    database: {
      generateId: false, // let database generate ID
    },
  },

  trustedOrigins: [BETTER_AUTH_URL ?? "http://localhost:4321"],
});

export type Auth = typeof auth;
