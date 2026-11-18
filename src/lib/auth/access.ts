// lib/auth/access.ts
import { and, eq, exists, ne, or, sql } from "drizzle-orm";
import { isSiteAdmin } from "./permissions";
import { db } from "@db/db";
import { Booking, BookingAssignment, BookingClient, Location } from "@db/schema";

export async function canViewLocation(
  user: { id: string; role?: string | null; banned?: boolean | null },
  locationId: string,
) {
  if (user.banned) return false;
  if (isSiteAdmin(user)) return true;

  const loc = await db.query.Location.findFirst({
    where: eq(Location.id, locationId),
    columns: { author_user_id: true },
  });
  if (!loc) return false;               // same response as "no access"
  if (loc.author_user_id === user.id) return true;

  const hit = await db
    .select({ id: Booking.id })
    .from(Booking)
    .where(
      and(
        eq(Booking.location_id, locationId),
        or(
          eq(Booking.author_user_id, user.id),
          exists(
            db.select({ one: sql`1` }).from(BookingClient).where(
              and(
                eq(BookingClient.booking_id, Booking.id),
                eq(BookingClient.user_id, user.id),
                ne(BookingClient.status, "declined"),
              ),
            ),
          ),
          exists(
            db.select({ one: sql`1` }).from(BookingAssignment).where(
              and(eq(BookingAssignment.booking_id, Booking.id), eq(BookingAssignment.user_id, user.id)),
            ),
          ),
        ),
      ),
    )
    .limit(1);

  return hit.length > 0;
}