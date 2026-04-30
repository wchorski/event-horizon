import { Client } from "pg";

export function createPgClient() {
  const required = ["PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE"];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  return new Client({
    // pg automatically reads PG* vars
    // Explicit config is optional but clearer
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  });
}

export function getPGDatabaseUrl() {
  return (
    `postgres://${process.env.PGUSER}:` +
    `${encodeURIComponent(process.env.PGPASSWORD!)}` +
    `@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`
  );
}
