import { randomDate, randomItem, randomSubset } from "@lib/random";
import users from "./users";

const workerRoles = ["PRIMARY", "ASSISTANT", "SUPPORT"] as const;
// const numToGenerate = 300;
const range = {
  start: new Date("2020-01-01T00:00:00Z"),
  end: new Date("2027-12-31T23:59:59Z"),
};

export function createWorkersForBooking(bookingId: string) {
  // exclude null users
  const validUsers = users.map((u) => u.id);

  // pick up to 3 unique workers
  const workerIds = randomSubset(validUsers, 3);

  return workerIds.map((workerId, idx) => ({
    id: crypto.randomUUID(), // or uuidv7()
    booking_id: bookingId,
    worker_id: workerId,
    role: idx === 0 ? "PRIMARY" : randomItem(workerRoles),
    date_assigned: randomDate(range),
  }));
}

// export default Array.from({ length: numToGenerate }, (_, i) =>
//   createWorkersForBooking(i),
// );
