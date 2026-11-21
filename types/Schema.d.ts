import type { MOMENTS_STORE } from "@client/indexedDB";
import {
  bookingAssignment as BookingAssignment,
  // Role,
  location as Location,
  event as Event,
  ticket as Ticket,
  booking as Booking,
  bookingStatusEnum,
  memberRoleEnum,
  assignmentsRoleEnum,
  timeline as Timeline,
} from "@db/schema";

import {user as User, organization as Organization, account as Account, member as Member, team as Team } from "@db/auth-schema"

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

// export type RoleInsert = typeof Role.$inferInsert;
// export type RoleSelect = typeof Role.$inferSelect;
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
export type TimelineInsert = typeof Timeline.$inferSelect;
export type TimelineSelect = typeof Timeline.$inferSelect;
export type OrganizationInsert = typeof Organization.$inferSelect;
export type OrganizationSelect = typeof Organization.$inferSelect;
export type IntegrationCredentialInsert =
  typeof IntegrationCredential.$inferSelect;
export type IntegrationCredentialSelect =
  typeof IntegrationCredential.$inferSelect;
export type DepartmentInsert = typeof Department.$inferSelect;
export type DepartmentSelect = typeof Department.$inferSelect;
export type MeetingPacketInsert = typeof MeetingPacket.$inferSelect;
export type MeetingPacketDirectorySelect =
  typeof MeetingPacketDirectory.$inferSelect;
export type MeetingPacketDirectoryInsert =
  typeof MeetingPacketDirectory.$inferSelect;
export type MeetingPacketSelect = typeof MeetingPacket.$inferSelect;
export type MemberInsert = typeof Member.$inferInsert;
export type MemberSelect = typeof Member.$inferSelect;
export type TeamInsert = typeof Team.$inferInsert;
export type TeamSelect = typeof Team.$inferSelect;
export type AccountInsert = typeof Account.$inferSelect;
export type AccountSelect = typeof Account.$inferSelect;
export type UserCreditSelect = {
  ticket: TicketSelect;
  user: UserSelect;
};
export type AnyEntitySelect =
  // | RoleSelect
  TicketSelect | UserSelect | EventSelect | LocationSelect;

export const schemaEntityMap = {
  roles: true,
  locations: true,
  users: true,
  events: true,
  tickets: true,
} as const;

export type SchemaEntity = keyof typeof schemaEntityMap;

export type UserCreditFlat = {
  userId: number;
  id: number;
  date?: Date;
  courseId?: number;
  grade?: string | null;
  attended: boolean;
  firstName: string;
  lastName: string;
  middleInitial: string | null;
  phone: string;
  email: string;
};

export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
export type AssignmentRoles = (typeof assignmentsRoleEnum.enumValues)[number];
export type MemberRoles = (typeof memberRoleEnum.enumValues)[number];

export type MomentStep = {
  id: number;
  momentId: number;
  timelineUuid: string;
  tbd: boolean;
  text: string;
  note: string;
  position: string;
};

export type Timeline = {
  id: string;
  bookingUuid: string | null;
  summary: string | null;
  date: Date;
  dateCivil: string;
  timezone: string | null;
  start: number;
  end: number;
  updatedAt: Date;
  createdAt: Date;
  rev: number;
  notes: string | null;
  secretNotes: string | null;
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
  groupId: number;
  skillId: number;
  timelineUuid: string;
  // step_id: number
};
export type TimelineMomentInput = {
  id: string;
  desc: string;
  groupId: string;
  skillId: string;
  note: string;
  start: string; // minutes (can exceed 1440)
  end: string; // minutes (can exceed 1440)
  tbd?: boolean;
};
export type TimelineGroup = {
  id: number;
  name: string;
  timelineUuid: string;
};

export type TimelineSkill = {
  name: string;
  id: number;
  timelineUuid: string;
  icon?: string;
  color?: string;
};

import {
  MOMENTS_STORE,
  GROUPS_STORE,
  SKILLS_STORE,
  STEPS_STORE,
} from "@client/indexedDB";
export type BtnAction = "delete" | "insert" | "create" | "drag";
export type BtnDirection = "above" | "below";
export type BtnType = "blocks" | "groups" | "skills" | "todos";
export type TimelineBtnAction = "commit" | "import" | "export" | "print";

export type TemplateGroupClone = Omit<TimelineGroup, "id"> & {
  sourceId: number;
};

export type TemplateSkillClone = Omit<TimelineSkill, "id"> & {
  sourceId: number;
};

export type TemplateMomentClone = Omit<
  TimelineMoment,
  "id" | "groupId" | "skillId"
> & {
  sourceId: number;
  sourceGroupId: number;
  sourceSkillId: number;
};

export type TemplateStepClone = Omit<TimelineStep, "id" | "momentId"> & {
  sourceId: number;
  sourceMomentId: number;
};

export type InsertableGroup = Omit<TimelineGroup, "id"> & {
  sourceId: number;
};

export type InsertableSkill = Omit<TimelineSkill, "id"> & {
  sourceId: number;
};

export type InsertableMoment = Omit<
  TimelineMoment,
  "id" | "groupId" | "skillId"
> & {
  sourceId: number;
  sourceGroupId: number;
  sourceSkillId: number;
};

export type InsertableStep = Omit<MomentStep, "id" | "momentId"> & {
  sourceId: number;
  sourceMomentId: number;
};

export type InsertableTimelineGraph = Omit<
  TimelineState,
  "groups" | "skills" | "moments" | "steps"
> & {
  groups: InsertableGroup[];
  skills: InsertableSkill[];
  moments: InsertableMoment[];
  steps: InsertableStep[];
};

export type MomentStepDB = {
  id: number;
  momentId: number;
  timelineUuid: string;
  text: string;
  note: string;
  position: string;
  tbd: boolean;
};

export type MomentStepImport = Omit<MomentStepDB, "id" | "momentId"> & {
  sourceId: number;
  sourceMomentId: number;
};

export type GoogleCalendarData = {
  eventId?: string;
  calendarId?: string;
  syncedAt?: string;
  // ...whatever fields you actually store
} | null;

export type ListMember = {
  id: string;
  organizationId: string;
  role: "owner" | "admin" | "member";
  createdAt: Date;
  userId: string;
  teamId?: string | undefined | undefined;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | undefined;
  };
};
