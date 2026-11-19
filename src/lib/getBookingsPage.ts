// lib/getBookingsPage
import { db } from "@db/db";
import { booking, bookingClient, location } from "@db/schema";
import { desc, count, eq, and, gt, or, inArray } from "drizzle-orm";

interface Props {
  page: number;
  perPage?: number;
  locationId?: string;
  sessionUserId: string;
  organizationId?: string;
  selectFields?: Object;
}

// TODO how do i NOT allow anonymous users to not view any. i need to think of permissions and access from db level
export async function getBookingsPage({
  page,
  perPage = 12,
  locationId,
  sessionUserId,
  organizationId,
}: Props) {
  if (!sessionUserId)
    throw new Error("getBookingsPage requires a sessionUserId");
  // bookings where this user is a linked client
  // const clientBookingIds = await db
  //   .select({ id: bookingClient.bookingId })
  //   .from(bookingClient)
  //   .where(eq(bookingClient.userId, sessionUserId));
  const bookingClients = await db.query.bookingClient.findMany({
    where: {
      userId: sessionUserId
    }
  })

  if (page < 1) page = 1;

  const myself = or(
    eq(booking.authorUserId, sessionUserId),
    inArray(booking.id, clientBookingIds),
  );

  const where = and(
    myself,
    locationId ? eq(booking.locationId, locationId) : undefined,
  );

  const [{ count: totalCount }] = await db
    .select({ count: count(booking.id) })
    .from(booking)
    .where(where);
  await db.

  const totalPages = Math.ceil(totalCount / perPage);
  if (page > totalPages && totalPages > 0) return { redirect: true as const };

  if (page > totalPages && totalPages > 0) {
    return { redirect: true as const };
  }

  const bookings = await db.query.booking.findMany({
    where: {
      OR: [
        {
          authorUserId: sessionUserId,
        },
        {
          id: {
            in: bookingClients.flatMap(bc => bc.id),
          },
        },
      ],
    },
    // orderBy: [{ start: "desc" }, { id: "desc" }],
    orderBy: (booking, { desc }) => [desc(booking.start), desc(booking.id)],
    limit: perPage,
    offset: (page - 1) * perPage,
    with: {
      // assignments: {
      //   with: {
      //     user: true,
      //     // role: true,
      //   },
      // },
      clients: {
        with: { accounts: true },
      },
      location: true,
      author: true,
      timeline: true,
    },
  });

  // TODO only fetch locations authored by the user, or already exist on invited locations.
  // maybe use a join transaction?
  const locations = await db.query.location.findMany({
    where: eq(location.authorUserId, sessionUserId),
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
    eventIds: bookings.flatMap((b) => b.eventId),
  };
}

export type BookingsPageResult = Awaited<ReturnType<typeof getBookingsPage>>;

// the success branch only (excludes { redirect: true })
export type BookingsPageData = Exclude<BookingsPageResult, { redirect: true }>;

// one booking, with every relation from the `with` block
export type BookingWithRelations = BookingsPageData["bookings"][number];
