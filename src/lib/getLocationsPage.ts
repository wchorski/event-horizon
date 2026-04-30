import { db } from "@db/db";
import { Location } from "@db/schema";
import { desc, count } from "drizzle-orm";

interface Props {
  page: number;
  perPage?: number;
}

export async function getLocationsPage({ page, perPage = 15 }: Props) {
  if (page < 1) page = 1;

  const totalResult = await db
    .select({ count: count(Location.id) })
    .from(Location);

  const totalCount = totalResult[0].count;
  const totalPages = Math.ceil(totalCount / perPage);

  if (page > totalPages && totalPages > 0) {
    return { redirect: true };
  }

  const locations = await db
    .select()
    .from(Location)
    .orderBy(desc(Location.id))
    .limit(perPage)
    .offset((page - 1) * perPage);

  return {
    locations,
    page,
    totalCount,
    totalPages,
    perPage,
  };
}
