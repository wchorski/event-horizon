import type { MOMENTS_STORE } from "@client/indexedDB";
import {
  BookingAssignment,
  Role,
  Location,
  User,
  Event,
  Ticket,
  Booking,
  bookingStatusEnum,
  assignmentsRoleEnum,
  BookingContractorWithRole,
} from "@db/schema";

export const models = {
  locations: Location,
  users: User,
  roles: Role,
  bookings: Booking,
  events: Event,
  tickets: Ticket,
  booking_contractors: BookingContractorWithRole,
} as const;

export type ModelName = (typeof models)[keyof typeof models]["_"]["name"];

export type RoleInsert = typeof Role.$inferInsert;
export type RoleSelect = typeof Role.$inferSelect;
export type TicketInsert = typeof Ticket.$inferInsert;
export type TicketSelect = typeof Ticket.$inferSelect;
export type UserInsert = typeof User.$inferInsert;
export type UserSelect = typeof User.$inferSelect;
export type EventInsert = typeof Event.$inferInsert;
export type EventSelect = typeof Event.$inferSelect;
export type LocationInsert = typeof Location.$inferInsert;
export type LocationSelect = typeof Location.$inferSelect;
export type BookingInsert = typeof Booking.$inferInsert;
export type BookingSelect = typeof Booking.$inferSelect;
export type BookingAssignmentInsert = typeof BookingAssignment.$inferInsert;
export type BookingAssignmentSelect = typeof BookingAssignment.$inferSelect;
export type UserCreditSelect = {
  ticket: TicketSelect;
  user: UserSelect;
};
export type AnyEntitySelect =
  | RoleSelect
  | TicketSelect
  | UserSelect
  | EventSelect
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

export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
export type AssignmentRoles = (typeof assignmentsRoleEnum.enumValues)[number];

export type MomentStep = {
  id: number;
  moment_id: number;
  tbd: boolean;
  text: string;
  note: string;
  order: number;
};

export type Timeline = {
  id: string;
  summary: string;
  date: Date;
  date_civil: string;
  timezone: string;
  start: number;
  end: number;
  date_modified: Date;
  date_created: Date;
  rev: number;
};

export type TimelineState = Timeline & TimelineData;

export type TimelineData = {
  moments: TimelineMoment[];
  steps: MomentStep[];
  groups: TimelineGroup[];
  skills: TimelineSkill[];
};

export type TimelineTemplate = Omit<Timeline, id> & {
  moments: Omit<TimelineMoment, id>[];
  steps: Omit<MomentStep, id>[];
  groups: Omit<TimelineGroup, id>[];
  skills: Omit<TimelineSkill, id>[];
};

export type TimelineMoment = {
  id: number;
  desc: string;
  note: string;
  start: number; // minutes (can exceed 1440)
  end: number; // minutes (can exceed 1440)
  tbd?: boolean;
  group_id: number;
  skill_id: number;
  timeline_uuid: string;
  // step_id: number
};
export type TimelineMomentInput = {
  id: string;
  desc: string;
  group_id: string;
  skill_id: string;
  note: string;
  start: string; // minutes (can exceed 1440)
  end: string; // minutes (can exceed 1440)
  tbd?: boolean;
};
export type TimelineGroup = {
  id: number;
  name: string;
  timeline_uuid: string;
};

export type TimelineSkill = {
  name: string;
  id: number;
  timeline_uuid: string;
  icon?: string;
  color?: string;
};

import {
  MOMENTS_STORE,
  GROUPS_STORE,
  SKILLS_STORE,
  STEPS_STORE,
} from "@client/indexedDB";
export type BtnAction = "delete" | "insert" | "create";
export type BtnDirection = "above" | "below";
export type BtnType = "blocks" | "groups" | "skills" | "todos";
export type TimelineBtnAction = "commit" | "import" | "export" | "print";
