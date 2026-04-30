// @lib/permissions.ts
import { db } from "@db/db";
import { User, Role } from "@db/schema";
import { eq } from "drizzle-orm";
import type { Session } from "./session";
import type { BaseRow } from "@ty/FieldConfig";
import { PERMISSIONS } from "./roles";

export type Permission = keyof typeof PERMISSIONS;

// TODO auth

export async function userCan(
  user_id: number,
  permission: Permission,
): Promise<boolean> {
  const [row] = await db
    .select({ permissions: Role.permissions })
    .from(Role)
    .innerJoin(User, eq(User.role_id, Role.id))
    .where(eq(User.id, user_id))
    .limit(1);

  const permissions = row?.permissions as Permission[] | null;
  if (!Array.isArray(permissions)) return false; // guard against malformed json

  return permissions.includes(permission);
}

export const WRITABLE_FIELDS = {
  userSelf: [
    "first_name",
    "last_name",
    "email",
    "phone",
    "address_1",
    "address_2",
    "city",
    "state",
    "zip",
  ],
  userFull: [
    "first_name",
    "last_name",
    "email",
    "phone",
    "address_1",
    "address_2",
    "city",
    "state",
    "zip",
    "attended",
    "event_id",
  ],
  creditFull: ["user_id", "event_id", "grade", "attended"],
} as const;

export type WritableScope = keyof typeof WRITABLE_FIELDS;

export const userPolicy = {
  read: async (session: Session, row: BaseRow) =>
    session.user_id === row.id ||
    (await userCan(session.user_id, PERMISSIONS.manageAllUsers)),
  uptimestamp: async (session: Session, row: BaseRow) =>
    session.user_id === row.id ||
    (await userCan(session.user_id, PERMISSIONS.manageAllUsers)),
  writableFields: async (session: Session, row: BaseRow) => {
    if (await userCan(session.user_id, "manageAllMembers"))
      return WRITABLE_FIELDS.userFull;

    if (session.user_id === row.id) return WRITABLE_FIELDS.userSelf;
    return [];
  },
};

export const creditPolicy = {
  read: async (session: Session, row: BaseRow) =>
    session.user_id === row.id ||
    (await userCan(session.user_id, PERMISSIONS.manageAllTickets)),
  uptimestamp: async (session: Session, row: BaseRow) =>
    session.user_id === row.id ||
    (await userCan(session.user_id, PERMISSIONS.manageAllTickets)),
  writableFields: async (session: Session, row: BaseRow) => {
    if (await userCan(session.user_id, "manageAllCredits"))
      return WRITABLE_FIELDS.creditFull;

    //? do not allow members to edit their own ticket
    // if (session.user_id === row.id) return WRITABLE_FIELDS.ownedCredit;
    return [];
  },
};

export function sanitizeFields<T extends Record<string, any>>(
  obj: T,
  fields: readonly string[],
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => fields.includes(key)),
  ) as Partial<T>;
}
