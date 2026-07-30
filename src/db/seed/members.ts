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
    id: "019fb43b-a057-7aaf-9356-2668760ede26",
    organizationId: organizations[0].id,
    userId: users[1].id,
    role: "staff",
    createdAt: new Date(),
  },
];

export default members;