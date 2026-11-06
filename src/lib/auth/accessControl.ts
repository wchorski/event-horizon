// lib/auth/accessControl.ts
import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  ownerAc,
  adminAc,
  memberAc,
} from "better-auth/plugins/organization/access";

export const orgStatements = {
  ...defaultStatements, // keep built-in org/member/invitation actions
  event: ["create", "read", "update", "delete", "publish"],
  ticket: ["create", "read", "update", "delete", "check-in"],
  packet: ["build", "publish", "read"],
  calendar: ["create", "read", "update", "delete"],
} as const;
export const orgAccess = createAccessControl(orgStatements);

export const organizationOwner = orgAccess.newRole({
  ...ownerAc.statements,

  event: ["create", "read", "update", "delete", "publish"],
  ticket: ["create", "read", "update", "delete", "check-in"],
  packet: ["build", "publish", "read"],
  calendar: ["create", "read", "update", "delete"],
});

export const organizationAdmin = orgAccess.newRole({
  ...adminAc.statements,

  event: ["create", "read", "update", "delete", "publish"],
  ticket: ["create", "read", "update", "delete", "check-in"],
  packet: ["build", "publish", "read"],
  calendar: ["create", "read", "update", "delete"],
});

export const organizationMember = orgAccess.newRole({
  ...memberAc.statements,

  event: ["read"],
  ticket: ["read"],
  packet: ["read"], // can view, can't publish
  calendar: ["read"],
});

export const organizationRoles = {
  owner: organizationOwner,
  admin: organizationAdmin,
  member: organizationMember,
};
