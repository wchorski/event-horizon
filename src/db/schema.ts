// db/schema.ts
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
  pgEnum,
  check,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type { GoogleCalendarData, TimelineData } from "@ty/Schema";

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

export const BOOKING_STATUSES = bookingStatusEnum.enumValues;

export const Booking = pgTable(
  "bookings",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    // TODO handled with helper
    // summary: ,
    start: timestamp().notNull(),
    end: timestamp().notNull(),
    notes: text(),
    secret_notes: text(),
    revision: integer().notNull().default(1),
    google_calendar: jsonb().$type<GoogleCalendarData>(),
    status: bookingStatusEnum("status").notNull().default("REQUESTED"),
    date_created: timestamp().notNull().defaultNow(),
    date_modified: timestamp().notNull().defaultNow(),
    // worker_ids: added with bookingRelations
    client_id: uuid().references(() => User.id),
    // TODO allow booking to survive if User is deleted
    // client_id: uuid().references(() => User.id, { onDelete: "set null" }),
    location_id: uuid().references(() => Location.id),
    event_id: uuid().references(() => Event.id),
    //? Timeline now owns the FK back to Booking 
    // timeline_id: uuid().references(() => Timeline.id),
    // service_id:
  },
  (table) => [
    check("end_after_start", sql`${table.end} > ${table.start}`),
  ],
);

// maybe connect this with "Roles" table as to make it configurable with labels and customize permissions
// export const assignmentsRoleEnum = pgEnum("worker_role", [
//   "PRIMARY",
//   "ASSISTANT",
//   "SUPPORT",
// ]);
// Junction table for many-to-many relationship between bookings and workers

export const BookingAssignment = pgTable(
  "booking_assignments",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    booking_id: uuid()
      .notNull()
      .references(() => Booking.id, { onDelete: "cascade" }),
    user_id: uuid()
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    // role: assignmentsRoleEnum("role").notNull().default("PRIMARY"),
    role_id: uuid()
      .notNull()
      .references(() => Role.id),

    date_assigned: timestamp().notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.booking_id, table.user_id),
  ],
);

export const bookingRelations = relations(Booking, ({ many, one }) => ({
  assignments: many(BookingAssignment),
  client: one(User, { fields: [Booking.client_id], references: [User.id] }),
  location: one(Location, {
    fields: [Booking.location_id],
    references: [Location.id],
  }),
  // Booking.timeline_id -> Timeline.id
  // inverse side — no fields/references, Drizzle infers this from
  // timelineRelations.booking below since it's the only FK path
  timeline: one(Timeline)
}));

export const bookingAssignmentRelations = relations(
  BookingAssignment,
  ({ one }) => ({
    booking: one(Booking, {
      fields: [BookingAssignment.booking_id],
      references: [Booking.id],
    }),
    user: one(User, {
      fields: [BookingAssignment.user_id],
      references: [User.id],
    }),
    role: one(Role, {
      fields: [BookingAssignment.role_id],
      references: [Role.id],
    }),
  }),
);

export const Timeline = pgTable("timelines", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  booking_id: uuid()
    .references(() => Booking.id, { onDelete: "cascade" }).unique(),
  owner_user_id: uuid()
    // .notNull()
    .references(() => User.id, { onDelete: "cascade" }),
  rev: integer().notNull().default(1),
  date_created: timestamp().notNull().defaultNow(),
  date: timestamp().notNull().defaultNow(),
  date_modified: timestamp().notNull().defaultNow(),
  timestamp: timestamp().notNull(),
  date_civil: text().notNull(),
  notes: text(),
  secret_notes: text(),
  color: text(),
  summary: text(),
  timezone: text(),
  start: integer().notNull(),
  end: integer().notNull(),
  // TODO if i start supporting rev undo then I'll need this to nest like `{timeline_1: {}, timleline_2: {}}`
  // data: jsonb("data").$type<Record<string, TimelineData>>(),
  data: jsonb("data").$type<TimelineData>(),
});

export const timelineRelations = relations(Timeline, ({ one }) => ({
  // Timeline.booking_id -> Booking.id
  booking: one(Booking, {
    fields: [Timeline.booking_id],
    references: [Booking.id],
  }),
}));

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
