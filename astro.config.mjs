// https://docs.astro.build/en/reference/configuration-reference/
// @ts-check
import { loadEnv } from "vite";
import { defineConfig, envField } from "astro/config";
import node from "@astrojs/node";

const NODE_ENV = String(process.env.NODE_ENV);
const { DOMAIN_URL, SITE_HOSTNAME, SITE_PROTOCOL, SITE_PORT } = loadEnv(
  NODE_ENV,
  process.cwd(),
  "",
);

// import db from '@astrojs/db';

// https://astro.build/config
export default defineConfig({
  site: DOMAIN_URL,
  security: {
    checkOrigin: true,
    // increase if allowing file uploads
    actionBodySizeLimit: 5 * 1024 * 1024, // 5 MB
    allowedDomains: [
      {
        hostname: SITE_HOSTNAME,
        protocol: SITE_PROTOCOL,
        port: SITE_PORT,
      },
    ],
  },

  server: {
    host: true,
  },
  //? caused problems with pagination + searchParams
  // redirects: {
  //   "/events/1": "/events",
  //   "/admin/events/1": "/admin/events",
  //   "/admin/locations/1": "/admin/locations",
  //   "/admin/users/1": "/admin/users",
  // },
  output: "server",

  adapter: node({
    mode: "standalone",
  }),

  env: {
    schema: {
      PUBLIC_HTMX_LOGS: envField.boolean({
        context: "client",
        access: "public",
        optional: true,
        default: false,
      }),
      SITE_HOSTNAME: envField.string({
        context: "server",
        access: "public",
        default: "locahost",
      }),
      SITE_PROTOCOL: envField.string({
        context: "server",
        access: "public",
        default: "http",
      }),
      SITE_PORT: envField.number({
        context: "server",
        access: "public",
        default: 4321,
      }),
      SITE_TITLE: envField.string({
        context: "client",
        access: "public",
        optional: true,
        default: "Event Horizon",
      }),
      SITE_EXCERPT: envField.string({
        context: "client",
        access: "public",
        optional: true,
        default: "Manage, market, and make events happen",
      }),
      DEFAULT_ROLE_ID: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      SERVER_TIMEZONE: envField.string({
        context: "server",
        access: "secret",
        default: "America/Chicago",
      }),
      DATALIST_TIMEZONES: envField.string({
        context: "client",
        access: "public",
        default: "America/Chicago, America/Indianapolis, America/Detroit",
      }),
      DATALIST_STATES: envField.string({
        context: "client",
        access: "public",
        default: "Illinois,Indiana,Michigan",
      }),
      DATALIST_CITIES: envField.string({
        context: "client",
        access: "public",
        optional: false,
        default: "Chicago,Indianapolis,Detroit",
      }),
      UMAMI_HOST_URL: envField.string({
        context: "client",
        access: "public",
      }),
      UMAMI_SCRIPT: envField.string({
        context: "client",
        access: "public",
        default: "umami.js",
      }),
      UMAMI_PROXY_PREFIX: envField.string({
        context: "client",
        access: "public",
        default: "/assets/ramen",
      }),
      UMAMI_WEB_ID: envField.string({
        context: "client",
        access: "public",
      }),
      PGHOST: envField.string({
        context: "server",
        access: "public",
        optional: false,
        default: "localhost",
      }),
      PGPORT: envField.number({
        context: "server",
        access: "public",
        optional: false,
        default: 5432,
      }),
      PGPASSWORD: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      PGDATABASE: envField.string({
        context: "server",
        access: "public",
        optional: false,
      }),
      ALLOW_PROD_SEED: envField.boolean({
        context: "server",
        access: "public",
        default: false,
      }),
      BETTER_AUTH_SECRET: envField.string({
        context: "server",
        access: "secret",
      }),
      BETTER_AUTH_URL: envField.string({
        context: "server",
        access: "secret",
        default: "http://localhost:4321",
      }),
      WP_USERNAME: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      WP_APP_PASSWORD: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      WORDPRESS_ENDPOINT: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
    },
  },
  // integrations: [db()]
});
