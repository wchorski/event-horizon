import { db } from "@db/db";
import { Booking, Location, User } from "@db/schema";
import { desc, count, eq, and, gt } from "drizzle-orm";

interface Props {
  page: number;
  perPage?: number;
  location_id?: string;
  selectFields?: Object;
}

export async function getBookingsPage({
  page,
  perPage = 12,
  location_id,
}: Props) {
  const conditions = [];

  if (location_id) {
    conditions.push(eq(Booking.location_id, location_id));
  }

  // const now = new Date();
  // conditions.push(gt(Booking.start, now));

  if (page < 1) page = 1;

  const totalResult = await db
    .select({ count: count(Booking.id) })
    .from(Booking)
    .where(and(...conditions));

  const totalCount = totalResult[0].count;
  const totalPages = Math.ceil(totalCount / perPage);

  if (page > totalPages && totalPages > 0) {
    return { redirect: true };
  }

  const bookings = await db.query.Booking.findMany({
    where: and(...conditions),
    orderBy: desc(Booking.start),
    limit: perPage,
    offset: (page - 1) * perPage,
    with: {
      workers: {
        with: {
          worker: true,
        },
      },
      client: true,
      location: true,
    },
  });

  console.log({ bookings });

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
    clients: bookings.filter((b) => b.client),
  };
}
