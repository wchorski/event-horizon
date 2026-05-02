// src/db/seed.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
//? only use if wanting random generated data
// import { seed } from "drizzle-seed";
import * as schema from "./schema.js";
import { seedData } from "./seed-data.js";
import { createPgClient, getPGDatabaseUrl } from "./client.js";
import { sql } from "drizzle-orm";
import { createWorkersForBooking } from "./seed/bookingWorkerWithRole.js";

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
  await db.delete(schema.Ticket);
  await db.delete(schema.Event);
  await db.delete(schema.User);
  await db.delete(schema.Location);
  await db.delete(schema.Role);
  await db.delete(schema.Booking);
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
console.log(`=== Roles (+${seedData.roles.length})===`);
await db.insert(schema.Role).values(seedData.roles);

console.log(`=== Locations (+${seedData.locations.length})===`);
await db.insert(schema.Location).values(seedData.locations);
// seedData.roles.forEach((element) => {
//   console.log(`+ ${element.label}`);
// });
console.log(`=== Users (+${seedData.users.length}) ===`);
await db.insert(schema.User).values(seedData.users);
// seedData.users.forEach((element) => {
//   console.log(`+ ${element.email}`);
// });

console.log(`=== Events (+${seedData.events.length})===`);
await db.insert(schema.Event).values(seedData.events);
// seedData.events.forEach((element) => {
//   console.log(`+ ${element.subject} | ${element.date_civil}`);
// });
const randomBookings = seedData.bookings;
console.log(`=== Bookings (+${randomBookings.length})===`);
await db.insert(schema.Booking).values(randomBookings);

const bookingWorkers = randomBookings.flatMap((b) =>
  createWorkersForBooking(b.id),
);
console.log(
  `=== Relations: Workers for Bookings (+${bookingWorkers.length})===`,
);
await db
  .insert(schema.BookingWorkerWithRole)
  .values(bookingWorkers)
  .onConflictDoNothing();

console.log(`=== Tickets (+${seedData.tickets.length})===`);
await db.insert(schema.Ticket).values(seedData.tickets);
// seedData.tickets.forEach((element) => {
//   console.log(
//     `+ event_id: ${element.event_id}, user_id: ${element.user_id}, attended: ${element.attended}`,
//   );
// });

await client.end();

const total =
  seedData.roles.length +
  seedData.bookings.length +
  seedData.events.length +
  seedData.locations.length +
  seedData.tickets.length +
  seedData.users.length;

console.log(`🌲 Database seeded successfully. ${total} items added 🌲`);
