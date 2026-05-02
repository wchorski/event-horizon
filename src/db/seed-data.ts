// db/seed-data

import { PERMISSIONS } from "@lib/auth/roles";
import type {
  EventSelect,
  TicketSelect,
  LocationSelect,
  UserSelect,
  RoleSelect,
  BookingSelect,
} from "@ty/Schema";

import users from "./seed/users";
import events from "./seed/events";
import bookings from "./seed/bookings";
import locations from "./seed/locations";
import roles from "./seed/roles";

type SeedData = {
  locations: LocationSelect[];
  tickets: TicketSelect[];
  users: UserSelect[];
  events: EventSelect[];
  roles: RoleSelect[];
  bookings: BookingSelect[];
};

export const seedData: SeedData = {
  roles,
  locations,
  tickets: [
    {
      id: "00000000-0000-0000-0000-000000000001",
      user_id: "00000000-0000-0000-0000-000000000001",
      event_id: "00000000-0000-0000-0000-000000055500",
      timestamp: new Date("2026-03-20T10:00:00"),
      grade: null,
      attended: true,
      date_created: new Date("2026-03-20T10:00:00"),
      date_modified: new Date("2026-03-20T10:00:00"),
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      user_id: "00000000-0000-0000-0000-000000000001",
      event_id: "00000000-0000-0000-0000-000000055500",
      timestamp: new Date("2026-03-20T10:00:00"),
      grade: null,
      attended: true,
      date_created: new Date("2026-03-20T10:00:00"),
      date_modified: new Date("2026-03-20T10:00:00"),
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      user_id: "00000000-0000-0000-0000-000000000002",
      event_id: "00000000-0000-0000-0000-000000055500",
      timestamp: new Date("2026-03-20T10:00:00"),
      grade: null,
      attended: true,
      date_created: new Date("2026-03-20T10:00:00"),
      date_modified: new Date("2026-03-20T10:00:00"),
    },
    {
      id: "00000000-0000-0000-0000-000000000004",
      user_id: "00000000-0000-0000-0000-000000000002",
      event_id: "00000000-0000-0000-0000-000000055500",
      timestamp: new Date("2026-03-20T10:00:00"),
      grade: null,
      attended: true,
      date_created: new Date("2026-03-20T10:00:00"),
      date_modified: new Date("2026-03-20T10:00:00"),
    },
    {
      id: "00000000-0000-0000-0000-000000000005",
      user_id: "00000000-0000-0000-0000-000000000003",
      event_id: "00000000-0000-0000-0000-000000055500",
      timestamp: new Date("2026-03-20T10:00:00"),
      grade: null,
      attended: true,
      date_created: new Date("2026-03-20T10:00:00"),
      date_modified: new Date("2026-03-20T10:00:00"),
    },
    {
      id: "00000000-0000-0000-0000-000000000006",
      user_id: "00000000-0000-0000-0000-000000000003",
      event_id: "00000000-0000-0000-0000-000000055500",
      timestamp: new Date("2026-03-20T10:00:00"),
      grade: null,
      attended: true,
      date_created: new Date("2026-03-20T10:00:00"),
      date_modified: new Date("2026-03-20T10:00:00"),
    },
    {
      id: "00000000-0000-0000-0000-000000000007",
      user_id: "00000000-0000-0000-0000-000000000004",
      event_id: "00000000-0000-0000-0000-000000055500",
      timestamp: new Date("2026-03-20T10:00:00"),
      grade: null,
      attended: true,
      date_created: new Date("2026-03-20T10:00:00"),
      date_modified: new Date("2026-03-20T10:00:00"),
    },
    {
      id: "00000000-0000-0000-0000-000000000008",
      user_id: "00000000-0000-0000-0000-000000000004",
      event_id: "00000000-0000-0000-0000-000000055500",
      timestamp: new Date("2026-03-20T10:00:00"),
      grade: null,
      attended: true,
      date_created: new Date("2026-03-20T10:00:00"),
      date_modified: new Date("2026-03-20T10:00:00"),
    },
    {
      id: "00000000-0000-0000-0000-000000000009",
      user_id: "00000000-0000-0000-0000-000000000005",
      event_id: "00000000-0000-0000-0000-000000055500",
      timestamp: new Date("2026-03-20T10:00:00"),
      grade: null,
      attended: true,
      date_created: new Date("2026-03-20T10:00:00"),
      date_modified: new Date("2026-03-20T10:00:00"),
    },
    {
      id: "00000000-0000-0000-0000-000000000010",
      user_id: "00000000-0000-0000-0000-000000000005",
      event_id: "00000000-0000-0000-0000-000000055500",
      timestamp: new Date("2026-03-20T10:00:00"),
      grade: null,
      attended: true,
      date_created: new Date("2026-03-20T10:00:00"),
      date_modified: new Date("2026-03-20T10:00:00"),
    },
  ],
  users,
  events,
  bookings,
};
