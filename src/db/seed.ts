// db/seed.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
//? only use if wanting random generated data
import * as schema from "@db/schema.js";
import { seedData } from "@db/seed-data.js";
import { createPgClient, getPGDatabaseUrl } from "@db/client.js";
import { createAssignmentsForBooking } from "@db/seed/bookingAssignments.js";
import { auth } from "@lib/auth.js";
import { uuidv7 } from "@client/uuidv7.js";
import { hashPassword } from "better-auth/crypto";
import members from "./seed/members";

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
  casing: "snake_case",
  // logger: import.meta.env.DEV
  // logger: true
});

// ---- optional: truncate (VERY explicit) --------------------

if (process.argv.includes("--truncate")) {
  console.log("⚠️ Truncating tables...");
  await db.delete(schema.BookingAssignment);
  await db.delete(schema.Booking);
  await db.delete(schema.Ticket);
  await db.delete(schema.Event);
  await db.delete(schema.Location);
  await db.delete(schema.User);
  await db.delete(schema.Role);
  await db.delete(schema.Organization);
  await db.delete(schema.Account);
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
  roles,
  accounts,
  events,
  tickets,
  bookings,
} = seedData;

console.log("🌱 Seeding Database 🌱");
console.log(`=== Organizations (+${organizations.length}) ===`);
const orgCoreced = organizations.map((item) => ({
  ...item,
  createdAt: new Date(item.createdAt),
  updatedAt: new Date(item.updatedAt),
}));
await db.insert(schema.Organization).values(orgCoreced);

console.log(`=== Roles (+${roles.length})===`);
await db.insert(schema.Role).values(roles);

console.log(`=== Users (+${users.length}) ===`);
const usersCoreced = users.map((item) => ({
  ...item,
  createdAt: new Date(item.createdAt),
  updatedAt: new Date(item.updatedAt),
}));
await db.insert(schema.User).values(usersCoreced);

console.log(`=== Members (+${members.length}) ===`);
const membersCoreced = members.map((item) => ({
  ...item,
  createdAt: new Date(item.createdAt),
  updatedAt: new Date(item.updatedAt),
}));
await db.insert(schema.Member).values(membersCoreced);

console.log(`=== Accounts (+${accounts.length})===`);
const accountsCoreced = await Promise.all(
  accounts.map(async (item) => {
    const usr = users.find((u) => u.id === item.userId);
    if (!usr)
      throw new Error(`usr not found: account.userId === ${item.userId}`);
    const hashed = await hashPassword(usr.id + SECRET);
    return {
      ...item,
      password: hashed,
    };
  }),
);
//! does not allow manual uuid insertion for user
// for (const { email, image, username, ...user } of firstThreeUsers) {
//   try {
//     const result = await auth.api.signUpEmail({
//       body: {
//         email,
//         password: uuidv7(),
//         image: image || undefined,
//         username: username || undefined,
//         name: username || "",
//         displayUsername: username || undefined,
//       },
//     });
//     console.log(`✅ created account: ${email}`);
//   } catch (err) {
//     console.error(`❌ failed to create account for ${email}:`, err);
//   }
// }
await db.insert(schema.Account).values(accountsCoreced);

console.log(`=== Locations (+${locations.length})===`);
await db.insert(schema.Location).values(locations);

console.log(`=== Events (+${events.length})===`);
const eventsCoreced = events.map((e) => ({
  ...e,
  timestamp: new Date(e.timestamp),
  createdAt: new Date(e.createdAt),
  updatedAt: new Date(e.updatedAt),
}));
await db.insert(schema.Event).values(eventsCoreced);

const randomBookings = bookings;
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

console.log(`=== Tickets (+${tickets.length})===`);
const ticketsCoreced = tickets.map((t) => ({
  ...t,
  timestamp: new Date(t.timestamp),
  createdAt: new Date(t.createdAt),
  updatedAt: new Date(t.updatedAt),
}));
await db.insert(schema.Ticket).values(ticketsCoreced);
// const accountsCoreced = seedData.accounts.map((t) => ({
//   ...t,
//   timestamp: new Date(t.timestamp),
//   createdAt: new Date(t.createdAt),
//   updatedAt: new Date(t.updatedAt),
// }));
// await db.insert(schema.Account).values(seedData.accounts);

await client.end();

const total =
  roles.length +
  randomBookings.length +
  bookingAssignments.length +
  events.length +
  locations.length +
  tickets.length +
  users.length +
  accounts.length;

console.log(`🌲 Database seeded successfully. ${total} items added 🌲`);
