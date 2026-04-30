// src/lib/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
// import { getPGDatabaseUrl } from "./client";
//? pool is better than client for concurrent connections
// import { Client } from "pg";
import { Pool } from "pg";

// console.log("db.ts DATABASE_URL: ", getPGDatabaseUrl());

const pool = createPgAstroPool();
// await client.connect();

export const db = drizzle(pool, {
  schema,
  // ssl: process.env.NODE_ENV === "production" ? "require" : undefined,
  // logger: import.meta.env.DEV
  // logger: true
});

export function createPgAstroPool() {
  const required = ["PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE"];

  for (const key of required) {
    if (!import.meta.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = import.meta.env;

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
