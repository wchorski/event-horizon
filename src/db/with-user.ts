// db/with-user.ts
import { sql } from "drizzle-orm";
import { db } from "@db/db";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type RlsContext = { userId: string | null; isAdmin: boolean };

export async function withRls<T>(ctx: RlsContext, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`set local role app_user`);
    await tx.execute(sql`select
      set_config('app.user_id', ${ctx.userId ?? ""}, true),
      set_config('app.is_admin', ${ctx.isAdmin ? "true" : "false"}, true)`);
    return fn(tx);
  });
}