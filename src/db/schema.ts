// src/lib/schema.ts
import {
  pgTable,
  integer,
  text,
  boolean,
  date,
  uniqueIndex,
  index,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const Role = pgTable("roles", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  label: text().notNull().unique(),
  excerpt: text(),
  permissions: text().array().notNull().default([]),
});

export const Location = pgTable(
  "locations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    name: text().notNull().unique(),
    address: text().notNull(),
    city: text().notNull(),
    state: text().notNull(),
    zip: text().notNull(),
    timezone: text().notNull(),
    excerpt: text(),
  },
  (table) => [
    index("locations_city_idx").on(table.city),
    index("locations_state_idx").on(table.state),
  ],
);

export const User = pgTable(
  "users",
  {
    // TODO switch to uuid when this app gets more serious and need more privacy with url
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    role_id: uuid().references(() => Role.id),
    first_name: text().notNull(),
    last_name: text().notNull(),
    middle_initial: text(),
    phone: text().notNull().unique(),
    email: text().notNull().unique(),
    address_1: text().notNull(),
    address_2: text(),
    city: text().notNull(),
    state: text().notNull(),
    zip: text().notNull(),
  },
  (table) => [index("users_role_id_idx").on(table.role_id)],
);

export const Event = pgTable(
  "events",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    wp_post_id: integer().unique(),
    subject: text().notNull(),
    excerpt: text(),
    where: text(),
    timestamp: timestamp().notNull(),
    date_civil: text().notNull(),
    location_id: uuid()
      .notNull()
      .references(() => Location.id),
  },
  (table) => [
    index("events_location_id_idx").on(table.location_id),
    uniqueIndex("events_subject_date_location_unique").on(
      table.subject,
      table.date_civil,
      table.location_id,
    ),
  ],
);

export const Ticket = pgTable(
  "tickets",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    user_id: uuid("user_id")
      .notNull()
      .references(() => User.id),
    event_id: uuid("event_id")
      .notNull()
      .references(() => Event.id),
    timestamp: timestamp().notNull(),
    grade: text(),
    // TODO thinking about changing to `redeemed`
    attended: boolean().notNull().default(false),
  },
  (table) => [
    index("tickets_user_id_idx").on(table.user_id),
    index("tickets_event_id_idx").on(table.event_id),
    // TODO only useful for ONE ticket per USER
    // uniqueIndex("tickets_event_user_unique").on(
    //   table.event_id,
    //   table.user_id,
    // ),
  ],
);
