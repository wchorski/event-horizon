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
  MS_CLIENT_ID,
  MS_SECRET_VALUE,
} = process.env;

// const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = import.meta.env;

import { passkey } from "@better-auth/passkey";
import { db } from "@db/db";
import * as schema from "@db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username, organization } from "better-auth/plugins";

const isProd = process.env.NODE_ENV === "production";

const socialProviders: Record<
  string,
  { clientId: string; clientSecret: string; mapProfileToUser?: any }
> = {};
if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET)
  socialProviders.github = {
    clientId: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    mapProfileToUser: (profile: { name?: string | null; login: string }) => ({
      ...deriveNameParts({ fullName: profile.name, fallback: profile.login }),
      username: deriveUsernameBase(profile.login),
    }),
  };
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET)
  socialProviders.google = {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    mapProfileToUser: (profile: {
      given_name?: string;
      family_name?: string;
      name?: string;
      email: string;
    }) =>
      deriveNameParts({
        givenName: profile.given_name,
        familyName: profile.family_name,
        fullName: profile.name,
        fallback: profile.email.split("@")[0],
      }),
  };
if (FACEBOOK_CLIENT_ID && FACEBOOK_CLIENT_SECRET)
  socialProviders.facebook = {
    clientId: FACEBOOK_CLIENT_ID,
    clientSecret: FACEBOOK_CLIENT_SECRET,
    mapProfileToUser: (profile: {
      first_name?: string;
      last_name?: string;
      name?: string;
      email?: string;
    }) =>
      deriveNameParts({
        givenName: profile.first_name,
        familyName: profile.last_name,
        fullName: profile.name,
        fallback: profile.email?.split("@")[0] ?? "Facebook User",
      }),
  };
if (MS_CLIENT_ID && MS_SECRET_VALUE)
  socialProviders.microsoft = {
    clientId: MS_CLIENT_ID,
    clientSecret: MS_SECRET_VALUE,
    mapProfileToUser: (profile: {
      given_name?: string;
      family_name?: string;
      name?: string;
      preferred_username?: string;
    }) =>
      deriveNameParts({
        givenName: profile.given_name,
        familyName: profile.family_name,
        fullName: profile.name,
        fallback: profile.preferred_username ?? "Microsoft User",
      }),
    // Optional
    // tenantId: "common",
    // authority: "https://login.microsoftonline.com", // Authentication authority URL
    // prompt: "select_account", // Forces account selection
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
  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      first_name: { type: "string", required: true },
      last_name: { type: "string", required: true },
      // username is already placed here by plugin
    },
  },
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
    organization(),
  ],
  advanced: {
    cookiePrefix: "eh",
    useSecureCookies: isProd,
    database: {
      generateId: false, // let database generate ID
    },
  },

  trustedOrigins: [BETTER_AUTH_URL ?? "http://localhost:4321"],
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: [
        "github",
        "facebook",
        "google",
        "microsoft",
        "email-password",
      ],
      // allowDifferentEmails: false, // default — keep this unless you have a reason not to
    },
  },
});

export type Auth = typeof auth;

// src/lib/auth/name.ts
export interface NameParts {
  first_name: string;
  last_name: string;
}

interface DeriveNameInput {
  /** Provider-native given/first name, when it's exposed as its own field
   * (Google's given_name, Facebook's first_name, Microsoft's given_name). */
  givenName?: string | null;
  /** Provider-native family/last name, when exposed separately. */
  familyName?: string | null;
  /** A single combined name string to fall back to and split, when the
   * provider only gives you one field (e.g. GitHub's `name`). */
  fullName?: string | null;
  /** Last-resort value if there's no usable name at all — GitHub's `login`,
   * or an email local-part. Always required so this never throws. */
  fallback: string;
}

/**
 * Normalizes whatever name shape an OAuth provider's profile gives you into
 * our schema's separate first_name/last_name fields. Use this from every
 * provider's mapProfileToUser so the fallback behavior stays consistent.
 *
 * Priority:
 * 1. Provider-native givenName, if present — pairs with familyName if present,
 *    otherwise last_name is "".
 * 2. Split a single fullName string: the LAST word becomes last_name,
 *    everything before it becomes first_name (so "Mary Jane Smith" ->
 *    { first_name: "Mary Jane", last_name: "Smith" }).
 * 3. fallback as first_name, with an empty last_name.
 */
export function deriveNameParts({
  givenName,
  familyName,
  fullName,
  fallback,
}: DeriveNameInput): NameParts {
  const trimmedGiven = givenName?.trim();
  if (trimmedGiven) {
    return {
      first_name: trimmedGiven,
      last_name: familyName?.trim() ?? "",
    };
  }

  const trimmedFull = fullName?.trim();
  if (trimmedFull) {
    const words = trimmedFull.split(/\s+/);

    if (words.length === 1) {
      return { first_name: words[0], last_name: "" };
    }

    const last_name = words[words.length - 1];
    const first_name = words.slice(0, -1).join(" ");
    return { first_name, last_name };
  }

  return {
    first_name: fallback.trim() || "Anon-User",
    last_name: "Anon-User",
  };
}

/**
 * Builds a URL/DB-safe username base from an identifying string (GitHub
 * login, email local-part, etc). Not guaranteed unique by itself — see
 * ensureUniqueUsername in the create-user hook for the real uniqueness check.
 */
export function deriveUsernameBase(seed: string): string {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);

  return base || "user";
}
