// db/migrate.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
const DATABASE_URL = `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
console.log("===> DATABASE_URL, ", DATABASE_URL);

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

migrate(db, { migrationsFolder: "./drizzle" })
  .then(() => {
    console.log("Migrations applied");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
