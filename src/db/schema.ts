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
  json,
  pgEnum,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

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
    date_created: timestamp().notNull().defaultNow(),
    date_modified: timestamp().notNull().defaultNow(),
  },
  (table) => [index("users_role_id_idx").on(table.role_id)],
);

// export const Service = pgTable("services", {
//   id: uuid("id").primaryKey().default(sql`uuidv7()`),
//   // ... service fields
// });

export const bookingStatusEnum = pgEnum("booking_status", [
  "REQUESTED",
  "CANCELED",
  "DECLINED",
  "HOLDING",
  "ACCEPTED",
  "POSTPONED",
]);

export const Booking = pgTable(
  "bookings",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    start: timestamp().notNull(),
    end: timestamp().notNull(),
    notes: text(),
    secret_notes: text(),
    revision: integer().notNull().default(1), // default to 1
    google_calendar: json(),
    status: bookingStatusEnum("status").notNull().default("REQUESTED"),
    date_created: timestamp().notNull().defaultNow(),
    date_modified: timestamp().notNull().defaultNow(),
    // contractors_id:
    client_id: uuid().references(() => User.id),
    location_id: uuid().references(() => Location.id),
    event_id: uuid().references(() => Event.id),
    // service_id:
  },
  (table) => ({
    endAfterStart: check("end_after_start", sql`${table.end} > ${table.start}`),
  }),
);

export const contractorRoleEnum = pgEnum("contractor_role", [
  "PRIMARY",
  "ASSISTANT",
  "SUPPORT",
]);
// Junction table for many-to-many relationship between bookings and contractors
export const BookingContractorWithRole = pgTable("booking_contractors", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  booking_id: uuid()
    .notNull()
    .references(() => Booking.id, { onDelete: "cascade" }),
  contractor_id: uuid()
    .notNull()
    .references(() => User.id, { onDelete: "cascade" }),
  role: contractorRoleEnum("role").default("PRIMARY"),
  date_assigned: timestamp().notNull().defaultNow(),
});

export const bookingRelations = relations(Booking, ({ many, one }) => ({
  contractors: many(BookingContractorWithRole),
  client: one(User, { fields: [Booking.client_id], references: [User.id] }),
  location: one(Location, {
    fields: [Booking.location_id],
    references: [Location.id],
  }),
}));

export const bookingEmployeeRelations = relations(
  BookingContractorWithRole,
  ({ one }) => ({
    booking: one(Booking, {
      fields: [BookingContractorWithRole.booking_id],
      references: [Booking.id],
    }),
    employee: one(User, {
      fields: [BookingContractorWithRole.contractor_id],
      references: [User.id],
    }),
  }),
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
    host: uuid().references(() => User.id),
    date_created: timestamp().notNull().defaultNow(),
    date_modified: timestamp().notNull().defaultNow(),
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
    date_created: timestamp().notNull().defaultNow(),
    date_modified: timestamp().notNull().defaultNow(),
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
