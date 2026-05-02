import type { Booking } from "@db/schema";
import type { BookingSelect } from "@ty/Schema";
import users from "./users";
import locations from "./locations";
import { randomDate, randomInt, randomItem } from "@lib/random";
import { modifyHours } from "@lib/dateAndTime";

const user_ids: (string | null)[] = users.map((u) => u.id);
user_ids.push(null);
const location_ids: (string | null)[] = locations.map((l) => l.id);
location_ids.push(null);

const numToGenerate = 300;
const range = {
  start: new Date("2020-01-01T00:00:00Z"),
  end: new Date("2027-12-31T23:59:59Z"),
}

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
  const id = `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`;

  const start = randomDate(range);
  const durationHours = randomInt(1, 8); // 1–8 hour events
  const end = modifyHours(start, durationHours);

  return {
    id,
    start,
    end,
    date_created: modifyHours(start, -500),
    date_modified: modifyHours(start, -300),
    revision: Math.floor(Math.random() * 20),
    google_calendar: null,
    status: randomStatus(),
    client_id: randomItem(user_ids),
    location_id: randomItem(location_ids),
    event_id: null,
    notes: null,
    secret_notes: null,
  };
}

export default Array.from({ length: numToGenerate }, (_, i) =>
  createBooking(i),
);
