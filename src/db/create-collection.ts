import "dotenv/config"; // ensures .env is loaded
import { Client } from "pg";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to create database in production");
}

const DB_COLLECTION = process.env.PGDATABASE

/**
 * IMPORTANT:
 * - Connect to an EXISTING admin database (usually "postgres")
 * - NOT the database you want to create
 */
const admin = new Client({
  // pg automatically reads PG* vars
  // Explicit config is optional but clearer
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: "postgres",
});

await admin.connect();

// ✅ Avoid crashing if DB already exists
await admin
  .query(`SELECT 1 FROM pg_database WHERE datname = $1`, [DB_COLLECTION])
  .then(async (res) => {
    if (res.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${DB_COLLECTION}"`);
      console.log(`✅ Database "${DB_COLLECTION}" created`);
    } else {
      console.log(`ℹ️ Database "${DB_COLLECTION}" already exists`);
    }
  });

await admin.end();
