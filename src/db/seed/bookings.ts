// db/seed/bookings
import type { BookingSelect } from "@ty/Schema";
import users from "./users";
import locations from "./locations";
import { randomDate, randomInt, randomItem } from "@lib/random";
import { modifyByNumOfHours } from "@lib/dateAndTime";
import { uuidv7 } from "@client/uuidv7";

const userIds: (string | null)[] = users.map((u) => u.id);
userIds.push(null);
const locationIds: (string | null)[] = locations.map((l) => l.id);
locationIds.push(null);

const numToGenerate = 300;
const range = {
  start: new Date("2020-01-01T00:00:00Z"),
  end: new Date("2027-12-31T23:59:59Z"),
};

const statuses = [
  "REQUESTED",
  "CANCELED",
  "DECLINED",
  "HOLDING",
  "ACCEPTED",
  "POSTPONED",
] as const;

function randomStatus(): BookingSelect["status"] {
  return statuses[randomInt(0, statuses.length - 1)];
}

function createBooking(i: number): BookingSelect {
  const id = uuidv7();

  const start = randomDate(range);
  const durationHours = randomInt(1, 8); // 1–8 hour events
  const end = modifyByNumOfHours(start, durationHours);

  return {
    id,
    start,
    end,
    createdAt: modifyByNumOfHours(start, -500),
    updatedAt: modifyByNumOfHours(start, -300),
    revision: Math.floor(Math.random() * 20),
    google_calendar: null,
    status: randomStatus(),
    clientId: randomItem(userIds),
    locationId: randomItem(locationIds),
    eventId: null,
    notes: null,
    secretNotes: null,
    authorUserId: users[0].id,
    organizationId: null,
  };
}

export default Array.from({ length: numToGenerate }, (_, i) =>
  createBooking(i),
);
