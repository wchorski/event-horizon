// lib/getBookingsPage
import { db } from "@db/db";
import { Booking, BookingClient, Location, User } from "@db/schema";
import { desc, count, eq, and, gt, or, inArray } from "drizzle-orm";

interface Props {
  page: number;
  perPage?: number;
  location_id?: string;
  session_user_id: string;
  organization_id?: string;
  selectFields?: Object;
}

// TODO how do i NOT allow anonymous users to not view any. i need to think of permissions and access from db level
export async function getBookingsPage({
  page,
  perPage = 12,
  location_id,
  session_user_id,
  organization_id,
}: Props) {
  if (!session_user_id) throw new Error("getBookingsPage requires a session_user_id");
  // bookings where this user is a linked client
  const clientBookingIds = db
    .select({ id: BookingClient.booking_id })
    .from(BookingClient)
    .where(eq(BookingClient.user_id, session_user_id));

  if (page < 1) page = 1;

  const mine = or(
    eq(Booking.author_user_id, session_user_id),
    inArray(Booking.id, clientBookingIds),
  );

  const where = and(mine, location_id ? eq(Booking.location_id, location_id) : undefined);

  const [{ count: totalCount }] = await db
    .select({ count: count(Booking.id) })
    .from(Booking)
    .where(where);

  const totalPages = Math.ceil(totalCount / perPage);
  if (page > totalPages && totalPages > 0) return { redirect: true as const };

  if (page > totalPages && totalPages > 0) {
    return { redirect: true as const };
  }

  const bookings = await db.query.Booking.findMany({
    where,
    orderBy: [desc(Booking.start), desc(Booking.id)],
    limit: perPage,
    offset: (page - 1) * perPage,
    with: {
      assignments: {
        with: {
          user: true,
          // role: true,
        },
      },
      clients: {
        with: { user: { columns: { id: true, name: true } } },
      },
      location: true,
      author: true,
      timeline: true,
    },
  });

  // TODO only fetch locations authored by the user, or already exist on invited locations. 
  // maybe use a join transaction?
  const locations = await db.query.Location.findMany({
    where : eq(Location.author_user_id, session_user_id)
  });
  // .limit(perPage)
  // .offset((page - 1) * perPage);

  return {
    bookings,
    locations,
    page,
    totalCount,
    totalPages,
    perPage,
    clients: bookings.flatMap((b) => b.clients),
    authors: bookings.flatMap((b) => (b.author ? [b.author] : [])),
    // workers: bookings.map((b) => b.assignments).map((a) => a.user),
    event_ids: bookings.flatMap((b) => b.event_id),
  };
}

export type BookingsPageResult = Awaited<ReturnType<typeof getBookingsPage>>;

// the success branch only (excludes { redirect: true })
export type BookingsPageData = Exclude<BookingsPageResult, { redirect: true }>;

// one booking, with every relation from the `with` block
export type BookingWithRelations = BookingsPageData["bookings"][number];