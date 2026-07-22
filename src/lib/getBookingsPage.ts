import { db } from "@db/db";
import { Booking, Location, User } from "@db/schema";
import { desc, count, eq, and, gt, or } from "drizzle-orm";

interface Props {
  page: number;
  perPage?: number;
  location_id?: string;
  author_user_id?: string;
  client_id?: string;
  organization_id?: string;
  selectFields?: Object;
}

// TODO how do i NOT allow anonymous users to not view any. i need to think of permissions and access from db level
export async function getBookingsPage({
  page,
  perPage = 12,
  location_id,
  author_user_id,
  client_id,
  organization_id,
}: Props) {
  const conditions = [];

  if (location_id) {
    conditions.push(eq(Booking.location_id, location_id));
  }
  if (author_user_id) {
    conditions.push(eq(Booking.author_user_id, author_user_id));
  }
  if (client_id) {
    conditions.push(eq(Booking.client_id, client_id));
  }
  if (organization_id) {
    conditions.push(eq(Booking.organization_id, organization_id));
  }

  // const now = new Date();
  // conditions.push(gt(Booking.start, now));

  if (page < 1) page = 1;

  const totalResult = await db
    .select({ count: count(Booking.id) })
    .from(Booking)
    .where(or(...conditions));

  const totalCount = totalResult[0].count;
  const totalPages = Math.ceil(totalCount / perPage);

  if (page > totalPages && totalPages > 0) {
    return { redirect: true };
  }

  const bookings = await db.query.Booking.findMany({
    where: or(...conditions),
    orderBy: desc(Booking.start),
    limit: perPage,
    offset: (page - 1) * perPage,
    with: {
      assignments: {
        with: {
          user: true,
          role: true,
        },
      },
      client: true,
      location: true,
      author: true,
      timeline: true,
    },
  });

  // TODO don't fetch ALL locations. maybe use a join?
  const locations = await db.select().from(Location);
  // .limit(perPage)
  // .offset((page - 1) * perPage);

  return {
    bookings,
    locations,
    page,
    totalCount,
    totalPages,
    perPage,
    clients: bookings.flatMap((b) => (b.client ? [b.client] : [])),
    authors: bookings.flatMap((b) => (b.author ? [b.author] : [])),
    // workers: bookings.map((b) => b.assignments).map((a) => a.user),
    event_ids: bookings.flatMap((b) => b.event_id),
  };
}
