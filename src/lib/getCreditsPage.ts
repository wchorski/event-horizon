import { db } from "@db/db";
import { User, Ticket } from "@db/schema";
import { count } from "drizzle-orm";
import { crud } from "./crudRegistry";
import { TEST_ADMIN_SESSION } from "./auth/session";

const session = TEST_ADMIN_SESSION;

export async function getCreditsPage(page: number, perPage = 12) {
  if (page < 1) page = 1;

  const totalResult = await db.select({ count: count(User.id) }).from(User);

  const totalCount = totalResult[0].count;
  const totalPages = Math.ceil(totalCount / perPage);

  if (page > totalPages && totalPages > 0) {
    return { redirect: true };
  }

  //   const tickets = await crud.tickets.readMany(session)
  const users = await crud.users.readMany(session);
  const events = await crud.events.readMany(session);

  const tickets = await db
    .select()
    .from(Ticket)
    .limit(perPage)
    .offset((page - 1) * perPage);

  return {
    tickets,
    events,
    users,
    page,
    totalCount,
    totalPages,
    perPage,
  };
}
