// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

const required = ["PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE", "DATABASE_SSL"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const { NODE_ENV, PGPORT, PGUSER, PGPASSWORD, PGHOST, PGDATABASE, DATABASE_SSL } =
  process.env;

console.log({ NODE_ENV });

const DATABASE_PORT = NODE_ENV === "production" ? "5432" : PGPORT;
// drizzle-kit ONLY accepts a URL → construct it ONCE here
const DATABASE_URL =
  `postgres://${PGUSER}:` +
  `${encodeURIComponent(PGPASSWORD!)}` +
  `@${PGHOST}:${DATABASE_PORT}/${PGDATABASE}`;

console.log(
  "drizzle.config.ts DATABASE_URL: ",
  `postgres://${PGUSER}:` +
    `<PGPASSWORD>` +
    `@${PGHOST}:${DATABASE_PORT}/${PGDATABASE}`,
);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
  verbose: NODE_ENV === "development" ? true : false,
  dbCredentials: {
    url: DATABASE_URL,
    ssl: DATABASE_SSL === "true" ? "require" : undefined,
  },
});
