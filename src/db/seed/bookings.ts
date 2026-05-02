import type { Booking } from "@db/schema";
import type { BookingSelect } from "@ty/Schema";

const numToGenerate = 300;
const START_RANGE = new Date("2020-01-01T00:00:00Z").getTime();
const END_RANGE = new Date("2027-12-31T23:59:59Z").getTime();

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate() {
  const ts = randomInt(START_RANGE, END_RANGE);
  return new Date(ts);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
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

  const start = randomDate();
  const durationHours = randomInt(1, 8); // 1–8 hour events
  const end = addHours(start, durationHours);

  return {
    id,
    start,
    end,
    date_created: new Date(),
    date_modified: new Date(),
    revision: 1,
    google_calendar: null,
    status: randomStatus(),
    client_id: null,
    location_id: null,
    event_id: null,
    notes: null,
    secret_notes: null,
  };
}

export default Array.from({ length: numToGenerate }, (_, i) =>
  createBooking(i),
);
