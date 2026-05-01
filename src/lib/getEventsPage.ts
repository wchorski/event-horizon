import { db } from "@db/db";
import { Event, Location } from "@db/schema";
import { desc, count, eq, and } from "drizzle-orm";

interface Props {
  page: number;
  perPage?: number;
  location_id?: string;
  selectFields?: Object;
}

export async function getEventsPage({
  page,
  perPage = 12,
  location_id,
}: Props) {
  const conditions = [];

  if (location_id) {
    conditions.push(eq(Event.location_id, location_id));
  }

  if (page < 1) page = 1;

  const totalResult = await db
    .select({ count: count(Event.id) })
    .from(Event)
    .where(and(...conditions));

  const totalCount = totalResult[0].count;
  const totalPages = Math.ceil(totalCount / perPage);

  if (page > totalPages && totalPages > 0) {
    return { redirect: true };
  }

  const events = await db
    // TODO configurable conditional filter
    // .select({
    //   id: Event.id,
    //   timestamp: Event.timestamp,
    //   subject: Event.subject,
    //   excerpt: Event.excerpt,
    // })
    .select()
    .from(Event)
    .where(and(...conditions))
    .orderBy(desc(Event.timestamp))
    .limit(perPage)
    .offset((page - 1) * perPage);

  // TODO move this into one db call
  const locations = await db.select().from(Location);
  // .limit(perPage)
  // .offset((page - 1) * perPage);

  return {
    events,
    locations,
    page,
    totalCount,
    totalPages,
    perPage,
  };
}
