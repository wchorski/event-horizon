// https://docs.astro.build/en/reference/configuration-reference/
// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";

// import db from '@astrojs/db';

// https://astro.build/config
export default defineConfig({
  site: process.env.DOMAIN_URL,
  security: {
    checkOrigin: true,
    // increase if allowing file uploads
    actionBodySizeLimit: 5 * 1024 * 1024, // 5 MB
    allowedDomains: [
      {
        hostname: process.env.SITE_HOSTNAME,
        protocol: process.env.SITE_PROTOCOL,
        port: process.env.SITE_PORT,
      },
    ],
  },

  server: {
    host: true,
  },
  //? caused problems with pagination + searchParams
  // redirects: {
  //   "/attendance/events/1": "/attendance/events",
  //   "/attendance/admin/events/1": "/attendance/admin/events",
  //   "/attendance/admin/locations/1": "/attendance/admin/locations",
  //   "/attendance/admin/users/1": "/attendance/admin/users",
  // },
  output: "server",

  adapter: node({
    mode: "standalone",
  }),
  // env: {}
  // integrations: [db()]
});
