import type { MemberSelect } from "@ty/Schema";
import organizations from "@db/seed/organizations";
import users from "@db/seed/users";
const members: MemberSelect[] = [
  {
    id: "019fb43b-7417-7ed7-af78-24cf9067acd9",
    organizationId: organizations[0].id,
    userId: users[0].id,
    role: "owner",
    createdAt: new Date(),
  },
  {
    id: "01a0cf5b-71f0-755b-9be9-46a8afccefd3",
    organizationId: organizations[0].id,
    userId: users[1].id,
    role: "staff",
    createdAt: new Date(),
  },
  {
    id: "01a0cf5b-71f0-755b-9be9-46a8afccefd3",
    organizationId: organizations[1].id,
    userId: users[0].id,
    role: "owner",
    createdAt: new Date(),
  },
  {
    id: "01a0cf5c-5d2f-75aa-ba62-9740316677c8",
    organizationId: organizations[2].id,
    userId: users[0].id,
    role: "owner",
    createdAt: new Date(),
  },
];

export default members;