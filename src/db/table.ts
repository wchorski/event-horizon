// @db/table.ts: the one place that decides casing
import { snakeCase } from "drizzle-orm/pg-core";

export const pgTable = snakeCase.table;
export const pgSchema = snakeCase.schema;