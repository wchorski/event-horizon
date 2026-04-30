import { Role, Location, User, Event, Ticket } from "@db/schema";

export type RoleInsert = typeof Role.$inferInsert;
export type RoleSelect = typeof Role.$inferSelect;
export type CreditInsert = typeof Ticket.$inferInsert;
export type CreditSelect = typeof Ticket.$inferSelect;
export type UserInsert = typeof User.$inferInsert;
export type UserSelect = typeof User.$inferSelect;
export type CourseInsert = typeof Event.$inferInsert;
export type CourseSelect = typeof Event.$inferSelect;
export type LocationInsert = typeof Location.$inferInsert;
export type LocationSelect = typeof Location.$inferSelect;
export type UserCreditSelect = {
  ticket: CreditSelect;
  user: UserSelect;
};
export type AnyEntitySelect =
  | RoleSelect
  | CreditSelect
  | UserSelect
  | CourseSelect
  | LocationSelect;

export const schemaEntityMap = {
  roles: true,
  locations: true,
  users: true,
  events: true,
  tickets: true,
} as const;

export type SchemaEntity = keyof typeof schemaEntityMap;

export type UserCreditFlat = {
  user_id: number;
  id: number;
  date?: Date;
  courseId?: number;
  grade?: string | null;
  attended: boolean;
  role_id?: number | null;
  first_name: string;
  last_name: string;
  middle_initial: string | null;
  phone: string;
  email: string;
  address_1: string;
  address_2?: string | null;
  city: string;
  state: string;
  zip: string;
};
