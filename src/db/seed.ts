// src/db/seed.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
//? only use if wanting random generated data
// import { seed } from "drizzle-seed";
import * as schema from "./schema.js";
import { seedData } from "./seed-data.js";
import { createPgClient, getPGDatabaseUrl } from "./client.js";
import { sql } from "drizzle-orm";
import { createAssignmentsForBooking } from "./seed/bookingAssignments.js";

// ---- guards -------------------------------------------------

const isProd = process.env.NODE_ENV === "production";
const allowSeed =
  process.argv.includes("--seed") || process.env.SEED_DB === "true";

if (!allowSeed) {
  console.log("🌱 Seeding skipped (no --seed flag)");
  process.exit(0);
}

if (isProd && process.env.ALLOW_PROD_SEED !== "true") {
  throw new Error(
    "❌ Refusing to seed production without ALLOW_PROD_SEED=true",
  );
}

console.log("seed.ts DATABASE_URL: ", getPGDatabaseUrl());

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

const db = drizzle(client, {
  schema,
  // logger: true
});

// ---- optional: truncate (VERY explicit) --------------------

if (process.argv.includes("--truncate")) {
  console.log("⚠️ Truncating tables...");
  await db.delete(schema.BookingAssignment);
  await db.delete(schema.Booking);
  await db.delete(schema.Ticket);
  await db.delete(schema.Event);
  await db.delete(schema.User);
  await db.delete(schema.Location);
  await db.delete(schema.Role);
  await db.delete(schema.Organization);
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

console.log("🌱 Seeding Database 🌱");
console.log(`=== Organizations (+${seedData.organizations.length}) ===`);
const orgCoreced = seedData.organizations.map((item) => ({
  ...item,
  date_created: new Date(item.date_created),
  date_modified: new Date(item.date_modified),
}));
await db.insert(schema.Organization).values(orgCoreced);

console.log(`=== Roles (+${seedData.roles.length})===`);
await db.insert(schema.Role).values(seedData.roles);

console.log(`=== Users (+${seedData.users.length}) ===`);
const usersCoreced = seedData.users.map((item) => ({
  ...item,
  date_created: new Date(item.date_created),
  date_modified: new Date(item.date_modified),
}));
await db.insert(schema.User).values(usersCoreced);

console.log(`=== Locations (+${seedData.locations.length})===`);
await db.insert(schema.Location).values(seedData.locations);
// seedData.roles.forEach((element) => {
//   console.log(`+ ${element.label}`);
// });
// seedData.users.forEach((element) => {
//   console.log(`+ ${element.email}`);
// });

console.log(`=== Events (+${seedData.events.length})===`);
const eventsCoreced = seedData.events.map((e) => ({
  ...e,
  timestamp: new Date(e.timestamp),
  date_created: new Date(e.date_created),
  date_modified: new Date(e.date_modified),
}));
await db.insert(schema.Event).values(eventsCoreced);
// seedData.events.forEach((element) => {
//   console.log(`+ ${element.subject} | ${element.date_civil}`);
// });
const randomBookings = seedData.bookings;
console.log(`=== Bookings (+${randomBookings.length})===`);
await db.insert(schema.Booking).values(randomBookings);

const bookingAssignments = randomBookings.flatMap((b) =>
  createAssignmentsForBooking(b.id),
);
console.log(`=== Booking Assignments (+${bookingAssignments.length})===`);
await db
  .insert(schema.BookingAssignment)
  .values(bookingAssignments)
  .onConflictDoNothing();

console.log(`=== Tickets (+${seedData.tickets.length})===`);
const ticketsCoreced = seedData.tickets.map((t) => ({
  ...t,
  timestamp: new Date(t.timestamp),
  date_created: new Date(t.date_created),
  date_modified: new Date(t.date_modified),
}));
await db.insert(schema.Ticket).values(ticketsCoreced);
// seedData.tickets.forEach((element) => {
//   console.log(
//     `+ event_id: ${element.event_id}, user_id: ${element.user_id}, attended: ${element.attended}`,
//   );
// });

await client.end();

const total =
  seedData.roles.length +
  randomBookings.length +
  bookingAssignments.length +
  seedData.events.length +
  seedData.locations.length +
  seedData.tickets.length +
  seedData.users.length;

console.log(`🌲 Database seeded successfully. ${total} items added 🌲`);
