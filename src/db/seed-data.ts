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

import usersSeed from './seed/users'
import eventsSeed from './seed/events'
import bookingsSeed from './seed/bookings'

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
  locations: [
    {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Birthplace of Rock 'n' Roll (Sun Studio)",
      address: "706 Union Ave",
      city: "Memphis",
      state: "Tennessee",
      zip: "38103",
      timezone: "America/Chicago",
      excerpt:
        "A legendary recording room tied to early rock ‘n' roll history—perfect for a rockabilly / classic rock themed party vibe.",
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Hitsville U.S.A. (Motown Museum)",
      address: "2648 W Grand Blvd",
      city: "Detroit",
      state: "Michigan",
      zip: "48208",
      timezone: "America/Detroit",
      excerpt:
        "Instant Motown theme—think soul, R&B, and the 'Sound of Young America' energy for a dance-forward party.",
    },

    {
      id: "00000000-0000-0000-0000-000000000004",
      name: "Purple Rain Night (First Avenue)",
      address: "701 1st Ave N",
      city: "Minneapolis",
      state: "Minnesota",
      zip: "55403",
      timezone: "America/Chicago",
      excerpt:
        "Iconic Minneapolis music venue strongly associated with Prince/pop-funk era aesthetics—great for an 80s / purple neon theme.",
    },

    {
      id: "00000000-0000-0000-0000-000000000005",
      name: "Sunset Strip Rock Night (Whisky a Go Go)",
      address: "8901 W Sunset Blvd",
      city: "West Hollywood",
      state: "California",
      zip: "90069",
      timezone: "America/Los_Angeles",
      excerpt:
        "Classic Sunset Strip rock landmark—ideal for a guitars-and-leather, glam/rock party concept.",
    },
    {
      id: "00000000-0000-0000-0000-000000000000",
      name: "Online Live Stream",
      address: "/live-stream",
      city: "www.mywebiste.com",
      state: "internet",
      zip: "00000",
      timezone: "America/Chicago",
      excerpt: null,
    },
  ],
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
