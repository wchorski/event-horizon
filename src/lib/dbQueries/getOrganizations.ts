import { db } from "@db/db";
import { Organization, User } from "@db/schema";
import { count, asc } from "drizzle-orm";

interface Props {
  page: number;
  perPage?: number;
}

export async function getOrganizations({ page, perPage = 15 }: Props) {
  if (page < 1) page = 1;

  const totalResult = await db.select({ count: count(Organization.id) }).from(Organization);

  const totalCount = totalResult[0].count;
  const totalPages = Math.ceil(totalCount / perPage);

  if (page > totalPages && totalPages > 0) {
    return { redirect: true };
  }

  const organizations = await db
    .select()
    .from(Organization)
    .orderBy(asc(Organization.name))
    .limit(perPage)
    .offset((page - 1) * perPage);

  return {
    organizations,
    page,
    totalCount,
    totalPages,
    perPage,
  };
}
