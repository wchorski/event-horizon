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
import tickets from "./seed/tickets";

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
  tickets,
  users,
  events,
  bookings,
};
