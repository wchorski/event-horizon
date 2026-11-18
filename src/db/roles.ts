// db/roles.ts
import { pgRole } from "drizzle-orm/pg-core";
export const appUser = pgRole("app_user").existing(); // created by hand in step 1