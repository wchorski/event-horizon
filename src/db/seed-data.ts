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

import usersSeed from "./seed/users";
import eventsSeed from "./seed/events";
import bookingsSeed from "./seed/bookings";
import locationsSeed from "./seed/locations";

type SeedData = {
  locations: LocationSelect[];
  tickets: TicketSelect[];
  users: UserSelect[];
  events: EventSelect[];
  roles: RoleSelect[];
  bookings: BookingSelect[];
};

export const seedData: SeedData = {
  roles: [
    {
      id: "00000000-0000-0000-0000-000000000001",
      label: "admin",
      excerpt: "Permission to create/read/update/delete all data",
      permissions: Object.values(PERMISSIONS), // admin gets everything
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      label: "host",
      excerpt:
        "Permission to create/read/update/delete all users, events, locations, & tickets",
      permissions: [
        PERMISSIONS.viewAllUsers,
        PERMISSIONS.manageAllEvents,
        PERMISSIONS.viewAllTickets,
      ],
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      label: "attendee",
      excerpt:
        "Permission to create/read/update/delete all users, events, locations, & tickets",
      permissions: [PERMISSIONS.viewAllEvents],
    },
    {
      id: "00000000-0000-0000-0000-000000000004",
      label: "guest",
      excerpt: "Permission to only view events",
      permissions: [PERMISSIONS.viewAllEvents],
    },
  ],
  locations: locationsSeed,
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
  users: usersSeed,
  events: eventsSeed,
  bookings: bookingsSeed,
};
