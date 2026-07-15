// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

const required = ["PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const DATABASE_PORT = process.env.NODE_ENV === "production" ? "5432" : process.env.PGPORT
// drizzle-kit ONLY accepts a URL → construct it ONCE here
const DATABASE_URL =
  `postgres://${process.env.PGUSER}:` +
  `${encodeURIComponent(process.env.PGPASSWORD!)}` +
  `@${process.env.PGHOST}:${DATABASE_PORT}/${process.env.PGDATABASE}`;

console.log("drizzle.config.ts DATABASE_URL: ", DATABASE_URL);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
  verbose: process.env.NODE_ENV === "development" ? true : false,
  dbCredentials: {
    url: DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? "require" : undefined,
  },
});
