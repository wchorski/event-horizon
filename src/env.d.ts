interface ImportMetaEnv {
  readonly DATALIST_STATES?: string;
  readonly DATALIST_CITIES?: string;
  readonly DATALIST_TIMEZONES?: string;
  readonly WP_USERNAME?: string;
  readonly WP_APP_PASSWORD?: string;
  readonly WORDPRESS_ENDPOINT?: string;
  readonly DEFAULT_ROLE_ID?: string;
  readonly MS_SHAREPOINT_KYU_FOLDER_URL?: string;
  readonly PGUSER?: string;
  readonly PGPASSWORD?: string;
  readonly PGDATABASE?: string;
  readonly PGPORT?: string;
  readonly PGHOST?: string;
  readonly NODE_ENV?: "production" | "development";
  readonly DATABASE_ID_SECRET?: string;
  readonly SITE_TITLE?: string;
  readonly SITE_EXCERPT?: string;
  readonly UMAMI_HOST_URL?: string;
  readonly UMAMI_SCRIPT?: string;
  readonly UMAMI_WEB_ID?: string;
  readonly UMAMI_PROXY_PREFIX?: string;
  readonly DOMAIN_URL?: string;
  readonly BETTER_AUTH_SECRET?: string;
  readonly BETTER_AUTH_URL?: string;
  readonly GITHUB_CLIENT_ID?: string;
  readonly GITHUB_CLIENT_SECRET?: string;
  readonly GOOGLE_CLIENT_ID?: string;
  readonly GOOGLE_CLIENT_SECRET?: string;
  readonly FACEBOOK_CLIENT_ID?: string;
  readonly FACEBOOK_CLIENT_SECRET?: string;
  readonly PUBLIC_HTMX_LOGS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference path="../.astro/types.d.ts" />
import type { auth } from "../src/lib/auth";

declare global {
  namespace App {
    interface Locals {
      user: typeof auth.$Infer.Session.user | null;
      session: typeof auth.$Infer.Session.session | null;
    }
  }
}
// declare namespace App {
//   // Note: 'import {} from ""' syntax does not work in .d.ts files.
//   interface Locals {
//     user: import("better-auth").User | null;
//     session: import("better-auth").Session | null;
//   }
// }
