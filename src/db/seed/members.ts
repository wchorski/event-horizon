import type { MemberSelect } from "@ty/Schema";
import organizations from "@db/seed/organizations";
import users from "@db/seed/users";

const TAWTAW_ORG = organizations.find((org) => org.slug === "tawtaw");
const MOE_ORG = organizations.find((org) => org.slug === "moe");
const PVO_ORG = organizations.find((org) => org.slug === "pvo");

const SITE_OWNER = users.find((usr) => usr.email === "will@tawtaw.site");
const MOE_ADMIN_1 = users.find((usr) => usr.email === "namabile@moefunds.com");
const MOE_ADMIN_2 = users.find((usr) => usr.email === "czarembski@moefunds.com");

const now = new Date();

type Org = (typeof organizations)[number];
type User = (typeof users)[number];

// Returns a one-item array if both org and user exist, otherwise an empty array
const member = (
  id: string,
  org: Org | undefined,
  user: User | undefined,
  role: MemberSelect["role"],
): MemberSelect[] =>
  org && user
    ? [
        {
          id,
          organizationId: org.id,
          userId: user.id,
          role,
          createdAt: now,
          updatedAt: now,
        },
      ]
    : [];

const members: MemberSelect[] = [
  ...member("019fb43b-7417-7ed7-af78-24cf9067acd9", TAWTAW_ORG, SITE_OWNER, "owner"),
  ...member("01a0cf5b-71f0-755b-9be9-46a8afccefd3", PVO_ORG, SITE_OWNER, "owner"),
  ...member("01a0cf5c-5d2f-75aa-ba62-9740316677c8", MOE_ORG, SITE_OWNER, "owner"),
  ...member("01a0cf8d-376f-7092-957d-cf3da1ec88a1", MOE_ORG, MOE_ADMIN_1, "owner"),
  ...member("01a0cf8d-774c-7cef-b7ac-cc1a89417e77", MOE_ORG, MOE_ADMIN_2, "owner"),
];

export default members;