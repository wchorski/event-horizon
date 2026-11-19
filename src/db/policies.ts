// lib/access/policies.ts
import { pgPolicy, type AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { appUser } from "@db/roles";
import { myself, isAdmin } from "./sql";

const admin = (name: string) =>
  pgPolicy(name, { for: "all", to: appUser, using: isAdmin, withCheck: isAdmin });

const notBanned = (name: string) =>
  pgPolicy(name, { as: "restrictive", for: "all", to: appUser, using: sql`not app_is_banned()` });

export const locationPolicies = (t: { id: AnyPgColumn; authorUserId: AnyPgColumn }) => [
  admin("locations_admin"),
  pgPolicy("locations_owner", {
    for: "all", to: appUser,
    using: sql`${t.author_user_id} = ${myself}`,
    withCheck: sql`${t.author_user_id} = ${myself}`,
  }),
  // participants can read a location through a booking, never write it
  pgPolicy("locations_participant_read", {
    for: "select", to: appUser, using: sql`app_can_view_location(${t.id})`,
  }),
  notBanned("locations_not_banned"),
];

export const bookingPolicies = (t: { id: AnyPgColumn; authorUserId: AnyPgColumn; location_id: AnyPgColumn }) => [
  admin("bookings_admin"),
  pgPolicy("bookings_author", {
    for: "all", to: appUser,
    using: sql`${t.author_user_id} = ${myself}`,
    // can only author as yourself, and only at a location you own
    withCheck: sql`${t.author_user_id} = ${myself}
                   and (${t.location_id} is null or app_owns_location(${t.location_id}))`,
  }),
  pgPolicy("bookings_client_read", { for: "select", to: appUser, using: sql`app_is_booking_client(${t.id})` }),
  pgPolicy("bookings_worker_read", { for: "select", to: appUser, using: sql`app_is_booking_worker(${t.id})` }),
  notBanned("bookings_not_banned"),
];

export const bookingClientPolicies = (t: { booking_id: AnyPgColumn; user_id: AnyPgColumn }) => [
  admin("booking_clients_admin"),
  // booking author manages the invite list
  pgPolicy("booking_clients_author", {
    for: "all", to: appUser,
    using: sql`app_is_booking_author(${t.booking_id})`,
    withCheck: sql`app_is_booking_author(${t.booking_id})`,
  }),
  // a client sees only their own row, so invitees can't see each other's emails
  pgPolicy("booking_clients_self_read", { for: "select", to: appUser, using: sql`${t.user_id} = ${myself}` }),
  notBanned("booking_clients_not_banned"),
];