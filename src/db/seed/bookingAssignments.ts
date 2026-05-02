import { randomDate, randomItem, randomSubset } from "@lib/random";
import users from "./users";
import roles from "./roles";
import type { BookingAssignmentSelect } from "@ty/Schema";

const rolesNoAdmin = roles.slice(1);
// const numToGenerate = 300;
const range = {
  start: new Date("2020-01-01T00:00:00Z"),
  end: new Date("2027-12-31T23:59:59Z"),
};

export function createAssignmentsForBooking(
  bookingId: string,
): BookingAssignmentSelect[] {
  // exclude null users
  const validUsers = users.map((u) => u.id);
  const userIds = randomSubset(validUsers, 3);

  return userIds.map((user_id, i) => ({
    id: crypto.randomUUID(),
    booking_id: bookingId,
    user_id,
    role_id:
      i === 0
        ? rolesNoAdmin.find((r) => r.label === "worker")!.id
        : randomItem(rolesNoAdmin).id,
    date_assigned: randomDate(range),
  }));
}

// export default Array.from({ length: numToGenerate }, (_, i) =>
//   createWorkersForBooking(i),
// );
