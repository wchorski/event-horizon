// db/seed-data

import { PERMISSIONS } from "@lib/auth/roles";
import type {
  // RoleSelect,
  BookingSelect,
  AccountInsert,
} from "@ty/Schema";

import users, { type UserSeedInsert } from "./seed/users";
import events, { type EventSeedInsert } from "./seed/events";
import bookings from "./seed/bookings";
import locations, { type LocationSeedInsert } from "./seed/locations";
import tickets, { type TicketSeedInsert } from "./seed/tickets";
import organizations, { type OrganizationSeedInsert } from "./seed/organizations";
import accounts from "./seed/accounts";

type SeedData = {
  locations: LocationSeedInsert[];
  tickets: TicketSeedInsert[];
  users: UserSeedInsert[];
  events: EventSeedInsert[];
  bookings: BookingSelect[];
  organizations: OrganizationSeedInsert[];
  accounts: AccountInsert[];
};

export const seedData: SeedData = {
  locations,
  tickets,
  users,
  events,
  bookings,
  organizations,
  accounts,
};
