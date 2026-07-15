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
  id: uuid()
    .primaryKey()
    .default(sql`uuidv7()`),
  label: text().notNull().unique(),
  excerpt: text(),
  permissions: text().array().notNull().default([]),
  organization_id: uuid()
    .notNull()
    .references(() => Organization.id, { onDelete: "cascade" }),
});

export const Location = pgTable(
  "locations",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    name: text().notNull().unique(),
    address: text().notNull(),
    city: text().notNull(),
    state: text().notNull(),
    zip: text().notNull(),
    timezone: text().notNull(),
    excerpt: text(),
    author_user_id: uuid()
      .notNull()
      .references(() => User.id),
    organization_id: uuid().references(() => Organization.id, {
      onDelete: "cascade",
    }),
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
    role: text(),
    //? handled with `OrganizationMembership` relationship
    // organization_id: uuid()
    //   .notNull()
    //   .references(() => Organization.id, { onDelete: "cascade" }),
    username: text().notNull().unique(),
    displayUsername: text(),
    name: text().notNull(),
    first_name: text(),
    last_name: text(),
    middle_initial: text(),
    phone: text().unique(),
    email: text().notNull().unique(),
    emailVerified: boolean().default(false).notNull(),
    address_1: text(),
    address_2: text(),
    city: text(),
    state: text(),
    zip: text(),
    image: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    banned: boolean().default(false),
    banReason: text(),
    banExpires: timestamp(),
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
    id: uuid()
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
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    // worker_ids: added with bookingRelations
    author_user_id: uuid()
      .notNull()
      .references(() => User.id),
    client_id: uuid().references(() => User.id),
    // TODO allow booking to survive if User is deleted
    // client_id: uuid().references(() => User.id, { onDelete: "set null" }),
    location_id: uuid().references(() => Location.id),
    event_id: uuid().references(() => Event.id),
    organization_id: uuid().references(() => Organization.id, {
      onDelete: "cascade",
    }),
    //? Timeline now owns the FK back to Booking
    // timeline_id: uuid().references(() => Timeline.id),
    // service_id:
  },
  (table) => [check("end_after_start", sql`${table.end} >= ${table.start}`)],
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
  (table) => [unique().on(table.booking_id, table.user_id)],
);

export const bookingRelations = relations(Booking, ({ many, one }) => ({
  assignments: many(BookingAssignment),
  author: one(User, {
    fields: [Booking.author_user_id],
    references: [User.id],
    relationName: "booking_author",
  }),
  client: one(User, {
    fields: [Booking.client_id],
    references: [User.id],
    relationName: "booking_client",
  }),
  location: one(Location, {
    fields: [Booking.location_id],
    references: [Location.id],
  }),
  organization: one(Organization, {
    fields: [Booking.organization_id],
    references: [Organization.id],
  }),
  // Booking.timeline_id -> Timeline.id
  // inverse side — no fields/references, Drizzle infers this from
  // timelineRelations.booking below since it's the only FK path
  timeline: one(Timeline),
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
  id: uuid()
    .primaryKey()
    .default(sql`uuidv7()`),
  booking_id: uuid()
    .references(() => Booking.id, { onDelete: "cascade" })
    .unique(),
  owner_user_id: uuid()
    // .notNull()
    .references(() => User.id, { onDelete: "cascade" }),
  rev: integer().notNull().default(1),
  createdAt: timestamp().notNull().defaultNow(),
  date: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
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
  data: jsonb().$type<TimelineData>(),
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
    id: uuid()
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
    organization_id: uuid().references(() => Organization.id, {
      onDelete: "cascade",
    }),
    //? one to many relation `hosts`
    // host: uuid().references(() => User.id),
    author_user_id: uuid()
      .notNull()
      .references(() => User.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
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

// Junction table for many-to-many relationship between events and hosts
export const EventHost = pgTable(
  "event_hosts",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    event_id: uuid()
      .notNull()
      .references(() => Event.id, { onDelete: "cascade" }),
    user_id: uuid()
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    date_assigned: timestamp().notNull().defaultNow(),
  },
  (table) => [unique().on(table.event_id, table.user_id)],
);

export const eventRelations = relations(Event, ({ many, one }) => ({
  hosts: many(EventHost),
  location: one(Location, {
    fields: [Event.location_id],
    references: [Location.id],
  }),
  organization: one(Organization, {
    fields: [Event.organization_id],
    references: [Organization.id],
  }),
  author: one(User, {
    fields: [Event.author_user_id],
    references: [User.id],
    relationName: "event_author",
  }),
}));

export const eventHostRelations = relations(EventHost, ({ one }) => ({
  event: one(Event, {
    fields: [EventHost.event_id],
    references: [Event.id],
  }),
  User: one(User, {
    fields: [EventHost.user_id],
    references: [User.id],
    relationName: "event_host_user",
  }),
}));

export const Ticket = pgTable(
  "tickets",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    user_id: uuid()
      .notNull()
      .references(() => User.id),
    event_id: uuid()
      .notNull()
      .references(() => Event.id),
    timestamp: timestamp().notNull(),
    grade: text(),
    // TODO thinking about changing to `redeemed`
    attended: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
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

export const Organization = pgTable("organizations", {
  id: uuid()
    .primaryKey()
    .default(sql`uuidv7()`),
  name: text().notNull(),
  slug: text().notNull().unique(), // for subdomains/URLs: acme.yourapp.com
  // for isolated DB (needed for some enterprise buisness)
  dedicated_db_url: text(),
  color: text(),
  color_2: text(),
  logo: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const orgMemberRoleEnum = pgEnum("org_member_role", [
  "OWNER",
  "ADMIN",
  "STAFF",
  "CLIENT",
]);

export const OrganizationMembership = pgTable(
  "organization_memberships",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organization_id: uuid()
      .notNull()
      .references(() => Organization.id, { onDelete: "cascade" }),
    user_id: uuid()
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    role: orgMemberRoleEnum("role").notNull().default("STAFF"),
    date_joined: timestamp().notNull().defaultNow(),
  },
  (table) => [unique().on(table.organization_id, table.user_id)],
);

export const Session = pgTable(
  "sessions",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    expiresAt: timestamp().notNull(),
    token: text().notNull().unique(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: uuid("user_id")
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    impersonatedBy: text(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const Account = pgTable(
  "accounts",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    accountId: text("account_id").notNull(),
    providerId: text().notNull(),
    userId: uuid()
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp(),
    refreshTokenExpiresAt: timestamp(),
    scope: text(),
    password: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const Verification = pgTable(
  "verifications",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const Passkey = pgTable(
  "passkey",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    username: text(),
    publicKey: text().notNull(),
    userId: uuid()
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    credentialId: text().notNull(),
    counter: integer().notNull(),
    deviceType: text().notNull(),
    backedUp: boolean().notNull(),
    transports: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    aaguid: text(),
  },
  (table) => [
    index("passkey_userId_idx").on(table.userId),
    index("passkey_credentialID_idx").on(table.credentialId),
  ],
);

export const userRelations = relations(User, ({ many }) => ({
  sessions: many(Session),
  accounts: many(Account),
  passkeys: many(Passkey),
}));

export const sessionRelations = relations(Session, ({ one }) => ({
  User: one(User, {
    fields: [Session.userId],
    references: [User.id],
  }),
}));

export const accountRelations = relations(Account, ({ one }) => ({
  User: one(User, {
    fields: [Account.userId],
    references: [User.id],
  }),
}));
