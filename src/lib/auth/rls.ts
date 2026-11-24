//! file can be deleted in favor of middleware integration
// lib/auth/rls.ts: Better Auth glue
// import { auth } from "@lib/auth";
// import { withRls } from "@db/with-user";

// type Locals = { user: { id: string; role?: string | null } | null };

// export async function withSession<T>(fn: Parameters<typeof withRls<T>>[1]) {
//   const session = await auth.api.getSession({ headers: Astro.request.headers });
//   return withRls(
//     {
//       userId: session?.user.id ?? null,
//       isAdmin: session?.user.role === "admin", // Better Auth admin plugin
//     },
//     fn,
//   );
// }

// * USAGE 
// import { eq, and, ilike } from "drizzle-orm";
// import { withSession } from "@/lib/auth/rls";
// import { location, booking } from "@db/schema";

// // List: public + my private + ones I can see via bookings (no where clause needed)
// const locations = await withSession((tx) =>
//   tx.select().from(location).orderBy(location.name),
// );

// // Filtering still works as normal; RLS is applied on top
// const columbus = await withSession((tx) =>
//   tx.select().from(location).where(and(eq(location.city, "Columbus"), ilike(location.name, "%studio%"))),
// );

// // Relational query: RLS filters the nested tables too
// const bookingWithLocation = await withSession((tx) =>
//   tx.query.booking.findFirst({
//     where: { id: bookingId },
//     with: { location: true },
//   }),
// );

// // Insert: authorUserId must equal the session user or the withCheck fails
// const [created] = await withSession(async (tx) => {
//   return tx.insert(location).values({
//     name: "My Studio",
//     address: "1 Main St",
//     city: "Columbus",
//     state: "OH",
//     zip: "43215",
//     timezone: "America/New_York",
//     private: false,
//     authorUserId: session.user.id,
//   }).returning(); // returning also needs to pass SELECT policies
// });

// // Update/delete: silently affects 0 rows if you aren't the author (or admin)
// const updated = await withSession((tx) =>
//   tx.update(location).set({ private: false }).where(eq(location.id, id)).returning(),
// );
// if (updated.length === 0) throw new Error("Not found or not allowed");