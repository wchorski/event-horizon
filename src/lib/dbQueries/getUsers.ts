// lib/dbQueries/getUsers.ts
import { db } from "@db/db";

export const getUserDashboard = (id: string) =>
  db.query.user.findFirst({
    where: { id },
    with: {
      authoredLocations: {
        limit: 5,
        orderBy: { createdAt: "desc" },
      },
      authoredBookings: {
        limit: 5,
        orderBy: { start: "desc" },
        with: { timeline: true, location: true, clients: true },
      },
      clientBookings: {
        limit: 5,
        orderBy: { start: "desc" },
        with: { timeline: true, location: true, clients: true },
      },
    },
  });

type UserDashboard = NonNullable<Awaited<ReturnType<typeof getUserDashboard>>>;

export type BookingWithRelations = UserDashboard["authoredBookings"][number];
export type LocationRow = UserDashboard["authoredLocations"][number];