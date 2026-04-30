import { db } from "@db/db";
import { User } from "@db/schema";
import { count, asc } from "drizzle-orm";

interface Props {
  page: number;
  perPage?: number;
}

export async function getUsersPage({ page, perPage = 15 }: Props) {
  if (page < 1) page = 1;

  const totalResult = await db.select({ count: count(User.id) }).from(User);

  const totalCount = totalResult[0].count;
  const totalPages = Math.ceil(totalCount / perPage);

  if (page > totalPages && totalPages > 0) {
    return { redirect: true };
  }

  const users = await db
    .select()
    .from(User)
    .orderBy(asc(User.last_name))
    .limit(perPage)
    .offset((page - 1) * perPage);

  return {
    users,
    page,
    totalCount,
    totalPages,
    perPage,
  };
}
