// src/lib/db.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
// import { getPGDatabaseUrl } from "./client";
//? pool is better than client for concurrent connections
// import { Client } from "pg";
import { Pool } from "pg";

// console.log("db.ts DATABASE_URL: ", getPGDatabaseUrl());

const pool = createPgAstroPool();
// await client.connect();
const DB_LOGGER =
  process.env.DB_LOGGER === "true" && process.env.NODE_ENV !== "production";

export const db = drizzle(pool, {
  schema,
  casing: "snake_case",
  logger: DB_LOGGER,
  // logger: true
});

export function createPgAstroPool() {
  const required = ["PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE"];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
  console.log(
    "🔌 Runtime DB URL:",
    `${PGUSER}:*****${PGHOST}:${PGPORT}/${PGDATABASE}`,
  );

  // TODO utilize Organization `dedicated_db_url` connection for future enterprise customers
  // return new Client({
  return new Pool({
    // pg automatically reads PG* vars
    // Explicit config is optional but clearer
    host: PGHOST,
    port: Number(PGPORT),
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
  });
}
