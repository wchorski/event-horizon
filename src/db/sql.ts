// db/sql.ts
import { sql } from "drizzle-orm";

export const myself = sql`(select nullif(current_setting('app.user_id', true), '')::uuid)`;
export const isAdmin = sql`(select coalesce(current_setting('app.is_admin', true), '') = 'true')`;