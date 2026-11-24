// db/schema.ts
import {
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  foreignKey,
  primaryKey,
  unique,
  check,
  doublePrecision,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { pgTable } from "@db/table";
import { organization, user } from "@db/auth-schema";
import { bookingClientPolicies, bookingPolicies, locationPolicies } from "./policies";

export const pk = () =>
  uuid()
    .default(sql`uuidv7()`)
    .primaryKey();
/** foreign key column to a uuid pk (chain .notNull() / .references() as needed) */
export const fk = () => uuid();

export const bookingStatus = pgEnum("booking_status", [
  "REQUESTED",
  "CANCELED",
  "DECLINED",
  "HOLDING",
  "ACCEPTED",
  "POSTPONED",
]);
export const locationType = pgEnum("location_type", ["PUBLIC", "PRIVATE"]);
export const meetingPacketStatus = pgEnum("meeting_packet_status", [
  "DRAFT",
  "PUBLISHED",
]);
export const integrationProvider = pgEnum("integration_provider", [
  "microsoft",
  "google",
]);
export const memberRole = pgEnum("member_role", ["owner", "admin", "member"]);
export const bookingClientRole = pgEnum("booking_client_role", ["client"]);
export const bookingClientStatus = pgEnum("booking_client_status", [
  "invited",
  "accepted",
  "declined",
]);

export const bookingAssignment = pgTable(
  "booking_assignment",
  {
    id: pk(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    dateAssigned: timestamp("date_assigned").notNull().defaultNow(),
  },
  (table) => [
    unique("booking_assignments_booking_id_user_id_unique").on(
      table.bookingId,
      table.userId,
    ),
  ],
);

export const bookingClient = pgTable.withRLS(
  "booking_client",
  {
    id: pk(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "cascade" }),
    email: text().notNull(),
    userId: uuid("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    role: bookingClientRole().default("client").notNull(),
    status: bookingClientStatus().default("invited").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    claimedAt: timestamp("claimed_at"),
  },
  (table) => [
    index("booking_clients_booking_idx").using(
      "btree",
      table.bookingId.asc().nullsLast(),
    ),
    index("booking_clients_email_idx").using(
      "btree",
      table.email.asc().nullsLast(),
    ),
    index("booking_clients_user_idx").using(
      "btree",
      table.userId.asc().nullsLast(),
    ),
    unique("booking_clients_booking_email_role_unique").on(
      table.bookingId,
      table.email,
      table.role,
    ),
    ...bookingClientPolicies(table)
  ],
);

export const booking = pgTable(
  "booking",
  {
    id: pk(),
    start: timestamp().notNull(),
    end: timestamp().notNull(),
    notes: text(),
    secretNotes: text("secret_notes"),
    revision: integer().default(1).notNull(),
    googleCalendar: jsonb("google_calendar"),
    status: bookingStatus().default("REQUESTED").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => user.id),
    locationId: uuid("location_id").references(() => location.id),
    eventId: uuid("event_id").references(() => event.id),
    //! circular type error
    // timelineId: uuid("timeline_id").references((): AnyPgColumn => timeline.id, { onDelete: "set null" }),
    organizationId: uuid("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    check("end_after_start", sql`("end" >= start)`),
    index("bookings_author_idx").on(table.authorUserId),
    ...bookingPolicies(table),
  ],
);

export const eventHost = pgTable(
  "event_host",
  {
    id: pk(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    dateAssigned: timestamp("date_assigned").notNull().defaultNow(),
  },
  (table) => [
    unique("event_hosts_event_id_user_id_unique").on(
      table.eventId,
      table.userId,
    ),
  ],
);

export const event = pgTable(
  "event",
  {
    id: pk(),
    wpPostId: integer("wp_post_id"),
    subject: text().notNull(),
    excerpt: text(),
    where: text(),
    timestamp: timestamp().notNull(),
    dateCivil: text("date_civil").notNull(),
    locationId: uuid("location_id")
      .notNull()
      .references(() => location.id),
    organizationId: uuid("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    outlookEventId: text("outlook_event_id"),
    outlookWebLink: text("outlook_web_link"),
  },
  (table) => [
    index("events_location_id_idx").using(
      "btree",
      table.locationId.asc().nullsLast(),
    ),
    uniqueIndex("events_subject_date_location_unique").using(
      "btree",
      table.subject.asc().nullsLast(),
      table.dateCivil.asc().nullsLast(),
      table.locationId.asc().nullsLast(),
    ),
    unique("events_outlook_event_id_unique").on(table.outlookEventId),
    unique("events_wp_post_id_unique").on(table.wpPostId),
  ],
);

export const integrationCredential = pgTable(
  "integration_credential",
  {
    id: pk(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    provider: integrationProvider().notNull(),
    tenantId: text("tenant_id").notNull(),
    clientId: text("client_id").notNull(),
    secretCiphertext: text("secret_ciphertext").notNull(),
    secretIv: text("secret_iv").notNull(),
    secretAuthTag: text("secret_auth_tag").notNull(),
    keyVersion: integer("key_version").default(1).notNull(),
    expiresAt: timestamp("expires_at"),
    rotatedAt: timestamp("rotated_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("integration_credentials_org_idx").using(
      "btree",
      table.organizationId.asc().nullsLast(),
    ),
    unique("integration_credentials_organizationId_provider_unique").on(
      table.organizationId,
      table.provider,
    ),
  ],
);

export const location = pgTable.withRLS(
  "location",
  {
    id: pk(),
    name: text().notNull(),
    address: text().notNull(),
    city: text().notNull(),
    state: text().notNull(),
    zip: text().notNull(),
    timezone: text().notNull(),
    excerpt: text(),
    private: boolean().default(true).notNull(),
    // type:
    // latitude: doublePrecision("latitude"),
    // longitude: doublePrecision("longitude"),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => user.id),
    organizationId: uuid("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("locations_author_name_unique")
      .using("btree", table.authorUserId.asc().nullsLast(), sql`lower(name)`)
      .where(sql`(organization_id IS NULL)`),
    index("locations_city_idx").using("btree", table.city.asc().nullsLast()),
    uniqueIndex("locations_org_name_unique")
      .using("btree", table.organizationId.asc().nullsLast(), sql`lower(name)`)
      .where(sql`(organization_id IS NOT NULL)`),
    index("locations_state_idx").using("btree", table.state.asc().nullsLast()),
    index("locations_author_idx").on(table.authorUserId), // serves the RLS predicate
    ...locationPolicies(table),
  ],
);

export const meetingPacket = pgTable(
  "meeting_packet",
  {
    id: pk(),
    eventId: uuid("event_id").references(() => event.id, {
      onDelete: "cascade",
    }),
    status: meetingPacketStatus().default("DRAFT").notNull(),
    publishedFileId: text("published_file_id"),
    publishedFileUrl: text("published_file_url"),
    publishedAt: timestamp("published_at"),
    notes: text(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    sharepointFolderId: text("sharepoint_folder_id").notNull(),
    outlookEventId: text("outlook_event_id"),
    outlookWebLink: text("outlook_web_link"),
  },
  (table) => [
    uniqueIndex("meeting_packets_folder_unique").using(
      "btree",
      table.sharepointFolderId.asc().nullsLast(),
    ),
  ],
);

export const ticket = pgTable(
  "ticket",
  {
    id: pk(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id),
    timestamp: timestamp().notNull(),
    grade: text(),
    attended: boolean().default(false).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("tickets_event_id_idx").using(
      "btree",
      table.eventId.asc().nullsLast(),
    ),
    index("tickets_user_id_idx").using("btree", table.userId.asc().nullsLast()),
  ],
);

export const timeline = pgTable.withRLS(
  "timeline",
  {
    id: pk(),
    bookingId: uuid("booking_id")
      .references(() => booking.id, {
        onDelete: "set null",
      })
      .unique(),
    ownerUserId: uuid("owner_user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    rev: integer().default(1).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    date: timestamp()
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    timestamp: timestamp().notNull(),
    dateCivil: text("date_civil").notNull(),
    notes: text(),
    secretNotes: text("secret_notes"),
    color: text(),
    summary: text(),
    timezone: text(),
    start: integer().notNull(),
    end: integer().notNull(),
    data: jsonb(),
  },
  (table) => [unique("timelines_booking_id_unique").on(table.bookingId)],
);

//? generated in auth-schema.ts
// export const user = pgTable(
//   "user",
//   {
//     id: pk(),
//     role: text(),
//     username: text().notNull(),
//     displayUsername: text("display_username"),
//     name: text().notNull(),
//     firstName: text("first_name"),
//     lastName: text("last_name"),
//     middleInitial: text("middle_initial"),
//     phone: text(),
//     email: text().notNull(),
//     emailVerified: boolean("email_verified").default(false).notNull(),
//     address1: text("address_1"),
//     address2: text("address_2"),
//     city: text(),
//     state: text(),
//     zip: text(),
//     image: text(),
//     createdAt: timestamp("created_at").notNull().defaultNow(),
//     updatedAt: timestamp("updated_at").notNull().defaultNow(),
//     banned: boolean().default(false),
//     banReason: text("ban_reason"),
//     banExpires: timestamp("ban_expires"),
//   },
//   (table) => [
//     unique("users_email_unique").on(table.email),
//     unique("users_phone_unique").on(table.phone),
//     unique("users_username_unique").on(table.username),
//   ],
// );
