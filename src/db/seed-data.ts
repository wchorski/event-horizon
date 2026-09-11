// db/seed-data

import { PERMISSIONS } from "@lib/auth/roles";
import type {
  RoleSelect,
  BookingSelect,
  OrganizationSelect,
  AccountInsert,
} from "@ty/Schema";

import users, { type UserSeedInsert } from "./seed/users";
import events, { type EventSeedInsert } from "./seed/events";
import bookings from "./seed/bookings";
import locations, { type LocationSeedInsert } from "./seed/locations";
import roles from "./seed/roles";
import tickets, { type TicketSeedInsert } from "./seed/tickets";
import organizations from "./seed/organizations";
import accounts from "./seed/accounts";
import departments from "./seed/departments";
import type { DepartmentSeedInsert } from "./seed/departments";

type SeedData = {
  locations: LocationSeedInsert[];
  tickets: TicketSeedInsert[];
  users: UserSeedInsert[];
  events: EventSeedInsert[];
  roles: RoleSelect[];
  bookings: BookingSelect[];
  organizations: OrganizationSelect[];
  accounts: AccountInsert[];
  departments: DepartmentSeedInsert[];
};

export const seedData: SeedData = {
  roles,
  locations,
  tickets,
  users,
  events,
  bookings,
  organizations,
  accounts,
  departments,
};
