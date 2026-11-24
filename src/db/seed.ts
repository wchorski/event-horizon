// db/seed.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
//? only use if wanting random generated data
import * as schema from "@db/schema.js";
import * as authSchema from "@db/auth-schema.js";
import { seedData } from "@db/seed-data.js";
import { createPgClient, getPGDatabaseUrl } from "@db/client.js";
import { createAssignmentsForBooking } from "@db/seed/bookingAssignments.js";
import { hashPassword } from "better-auth/crypto";
import members from "./seed/members";
import { relations } from "./relations";
import { authRelations } from "./auth-schema";

// ---- guards -------------------------------------------------
const SECRET = process.env.BETTER_AUTH_SECRET;
const isProd = process.env.NODE_ENV === "production";
const allowSeed =
  process.argv.includes("--seed") || process.env.SEED_DB === "true";

if (!allowSeed) {
  console.log("🌱 Seeding skipped (no --seed flag)");
  process.exit(0);
}

if (isProd && process.env.ALLOW_PROD_SEED !== "true") {
  console.log("❌ Refusing to seed production without ALLOW_PROD_SEED=true");
} else {
  // console.log("🌱🌱🌱 seed.ts DATABASE_URL: ", getPGDatabaseUrl());

  const client = createPgClient(); // pg auto-reads PG* env vars
  console.log("pg connectionParameters:", (client as any).connectionParameters);
  client.on("error", (err) => console.error("🔥 pg client error event:", err));
  client.on("end", () => console.error("🔥 pg connection ended"));

  try {
    await client.connect();
    console.log("✅ connected");
  } catch (e) {
    console.error("❌ connect failed:", e);
    throw e;
  }

  const db = drizzle({
    client,
    relations: {...relations, ...authRelations}
    // logger: import.meta.env.DEV
    // logger: true
  });

  // ---- optional: truncate (VERY explicit) --------------------

  if (process.argv.includes("--truncate")) {
    console.log("⚠️ Truncating tables...");
    await db.delete(schema.bookingAssignment);
    await db.delete(schema.booking);
    await db.delete(schema.ticket);
    await db.delete(schema.event);
    await db.delete(schema.location);
    await db.delete(authSchema.user);
    await db.delete(authSchema.organization);
    await db.delete(authSchema.account);
  }

  // if (process.argv.includes("--truncate")) {
  //   console.log("⚠️ Truncating tables + resetting identities...");

  //   await db.execute(sql`
  //     TRUNCATE TABLE
  //       "tickets",
  //       "events",
  //       "users",
  //       "locations",
  //       "roles"
  //     CASCADE
  //   `);
  // }

  // ---- seed ---------------------------------------------------

  //? generator mode for fake / randomized data

  // await seed(db, schema, {
  //   Role: {
  //     count: 10,
  //     columns: {
  //       label: generators.text(),
  //     },
  //   },
  // });
  // await seed(db, schema).refine(
  //   () =>
  //     ({
  //       roles: seedData.roles,
  //       locations: seedData.locations,
  //       users: seedData.users,
  //       events: seedData.events,
  //       tickets: seedData.tickets,
  //     }) as any,
  // );

  const {
    users,
    locations,
    organizations,
    accounts,
    events,
    tickets,
    bookings,
  } = seedData;

  let total = 0
  let inserted = 0

  console.log("🌱 Seeding Database 🌱");
  const orgCoreced = organizations.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
  const inOrgs = await db
    .insert(authSchema.organization)
    .values(orgCoreced)
    .onConflictDoNothing()
    .returning();
  console.log(`=== Organizations (+${inOrgs.length}) ===`);
  total += organizations.length
  inserted += inOrgs.length

  // TODO this is just temp to keep seed small for now
  const usersCoreced = users.slice(0,10).map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
  const inUsers = await db
    .insert(authSchema.user)
    .values(usersCoreced)
    .onConflictDoNothing()
    .returning();
  console.log(`=== Users (+${inUsers.length}) ===`);
  total += users.length
  inserted += inUsers.length

  const membersCoreced = members.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    // updatedAt: new Date(item.updatedAt),
  }));
  const inMembers = await db
    .insert(authSchema.member)
    .values(membersCoreced)
    .onConflictDoNothing()
    .returning();
  console.log(`=== Members (+${inMembers.length}) ===`);
  total += members.length
  inserted += inMembers.length

  const accountsCoreced = await Promise.all(
    accounts.map(async (item) => {
      const usr = users.find((u) => u.id === item.userId);
      if (!usr?.id)
        throw new Error(`usr not found: account.userId === ${item.userId}`);
      const hashed = await hashPassword(usr.id + SECRET);
      return {
        ...item,
        password: hashed,
      };
    }),
  );

  const inAccounts = await db
    .insert(authSchema.account)
    .values(accountsCoreced)
    .onConflictDoNothing()
    .returning();
  console.log(`=== Accounts (+${inAccounts.length})===`);
  total += accounts.length
  inserted += inAccounts.length

  const locationsCoreced = locations.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
  const inLocs = await db
    .insert(schema.location)
    .values(locationsCoreced)
    .onConflictDoNothing()
    .returning();
  console.log(`=== Locations (+${inLocs.length})===`);
  total += locations.length
  inserted += inLocs.length

  // const eventsCoreced = events.map((e) => ({
  //   ...e,
  //   timestamp: new Date(e.timestamp),
  //   createdAt: new Date(e.createdAt),
  //   updatedAt: new Date(e.updatedAt),
  // }));
  // const inEvents = await db
  //   .insert(schema.event)
  //   .values(eventsCoreced)
  //   .onConflictDoNothing()
  //   .returning();
  // console.log(`=== Events (+${inEvents.length})===`);
  // total += events.length
  // inserted += inEvents.length

  const randomBookings = bookings;
  const inBooks = await db
    .insert(schema.booking)
    .values(randomBookings)
    .onConflictDoNothing()
    .returning();
  console.log(`=== Bookings (+${inBooks.length})===`);
  total += randomBookings.length
  inserted += inBooks.length

  // const bookingAssignments = randomBookings.flatMap((b) =>
  //   createAssignmentsForBooking(b.id),
  // );
  // const inBookAss = await db
  //   .insert(schema.bookingAssignment)
  //   .values(bookingAssignments)
  //   .onConflictDoNothing()
  //   .returning();
  // console.log(`=== Booking Assignments (+${inBookAss.length})===`);
  // total += bookingAssignments.length
  // inserted += inBookAss.length

  // const ticketsCoreced = tickets.map((t) => ({
  //   ...t,
  //   timestamp: new Date(t.timestamp),
  //   createdAt: new Date(t.createdAt),
  //   updatedAt: new Date(t.updatedAt),
  // }));
  // const inTixs = await db
  //   .insert(schema.ticket)
  //   .values(ticketsCoreced)
  //   .onConflictDoNothing()
  //   .returning();
  // console.log(`=== Tickets (+${inTixs.length})===`);
  // total += tickets.length
  // inserted += inTixs.length

  // const accountsCoreced = seedData.accounts.map((t) => ({
  //   ...t,
  //   timestamp: new Date(t.timestamp),
  //   createdAt: new Date(t.createdAt),
  //   updatedAt: new Date(t.updatedAt),
  // }));
  // const inAccounts = await db.insert(schema.Account).values(seedData.accounts);
  // console.log(`=== Accounts (+${inAccounts.length})===`);
  // total += seedData.accounts.length
  // inserted += inAccounts.length
  await client.end();

  // const total =
  //   randomBookings.length +
  //   bookingAssignments.length +
  //   events.length +
  //   locations.length +
  //   tickets.length +
  //   users.length +
  //   accounts.length +
  //   organizations.length +
  //   members.length;

  // const inserted =
  //   inBooks.length +
  //   inEvents.length +
  //   inLocs.length +
  //   inTixs.length +
  //   inUsers.length +
  //   inAccounts.length +
  //   inOrgs.length +
  //   inMembers.length;

  console.log(
    `🌲 Database seeded successfully. +${inserted} of ${total} items added 🌲`,
  );
}
