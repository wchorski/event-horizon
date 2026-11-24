// db/policies.ts
import { pgPolicy, type AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { appUser } from "@db/roles";
import { myself, isAdmin } from "./sql";

// using: You can only modify rows you already own.
// withCheck: After modification, the row must still belong to you.

const admin = (name: string) =>
  pgPolicy(name, {
    for: "all",
    to: appUser,
    using: isAdmin,
    withCheck: isAdmin,
  });

const notBanned = (name: string) =>
  pgPolicy(name, {
    as: "restrictive",
    for: "all",
    to: appUser,
    using: sql`
      NOT EXISTS (
        SELECT 1
        FROM public."user"
        WHERE id = ${myself}
        AND banned = true
      )
    `,
  });

export const locationPolicies = (t: {
  id: AnyPgColumn;
  authorUserId: AnyPgColumn;
  private: AnyPgColumn;
}) => [
  admin("location_admin"),
  pgPolicy("location_read", {
    for: "select", to: appUser,
    using: sql`${t.private} = false or ${t.authorUserId} = ${myself}`,
  }),
  pgPolicy("location_write", {
    for: "all", to: appUser,
    using: sql`${t.authorUserId} = ${myself}`,
    withCheck: sql`${t.authorUserId} = ${myself}`,
  }),
  // participants can read a location through a booking, never write it
  // pgPolicy("location_participant_read", {
  //   for: "select",
  //   to: appUser,
  //   using: sql`app_can_view_location(${t.id})`,
  // }),
  notBanned("location_not_banned"),
];

export const bookingPolicies = (t: {
  id: AnyPgColumn;
  authorUserId: AnyPgColumn;
  locationId: AnyPgColumn;
}) => [
  admin("booking_admin"),
  pgPolicy("booking_author", {
    for: "all",
    to: appUser,
    using: sql`${t.authorUserId} = ${myself}`,
    // can only author as yourself, and only at a location you own
    withCheck: sql`${t.authorUserId} = ${myself}`,
  }),
  pgPolicy("booking_read", {
    for: "select", to: appUser,
    using: sql`${t.authorUserId} = ${myself}`,
  }),
  //? make sure `booking_clients` can SELECT too
  // pgPolicy("booking_client_read", {
  //   for: "select",
  //   to: appUser,
  //   using: sql`app_is_booking_client(${t.id})`,
  // }),
  // pgPolicy("booking_worker_read", {
  //   for: "select",
  //   to: appUser,
  //   using: sql`app_is_booking_worker(${t.id})`,
  // }),
  notBanned("booking_not_banned"),
];

export const bookingClientPolicies = (t: {
  bookingId: AnyPgColumn;
  userId: AnyPgColumn;
}) => [
  admin("booking_client_admin"),
  // a client sees only their own row, so invitees can't see each other's emails
  pgPolicy("booking_client_read", {
    for: "select", to: appUser,
    using: sql`${t.userId} = ${myself}`,
  }),
  // booking's author manages the invite list. can see the booking_client details, status, etc.
  // pgPolicy("booking_client_author", {
  //   for: "all",
  //   to: appUser,
  //   using: sql`app_is_booking_author(${t.bookingId})`,
  //   withCheck: sql`app_is_booking_author(${t.bookingId})`,
  // }),
  notBanned("booking_clients_not_banned"),
];
